import prisma from '@/lib/prisma';
import { getEmployees, getScheduleByNumber, getPunches, getAfastamentos } from '@/lib/secullum-service';
import axios from 'axios';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { format, isAfter, isBefore, addMinutes, subDays, startOfDay, endOfDay } from 'date-fns';

/**
 * Nexus Engine v3.0
 *
 * - Sync active/inactive employees from Secullum
 * - For each active employee, resolve their schedule by calling
 *   GET /Horarios?numero=<HorarioNumero> which returns Dias with times
 * - Monitors ENTRADA, INTERVALO_SAIDA, INTERVALO_RETORNO, SAIDA
 * - Sends WhatsApp alert on each step (1st, 2nd, 3rd warning)
 */

// Cache schedules in-process to avoid redundant API calls within a single cycle
const scheduleCache = new Map<number, any>();

export async function processNexusCycle() {
    console.log('[Nexus Engine v3] Starting cycle...');
    scheduleCache.clear();

    const now = new Date();
    // Adjust to Brazil Time (UTC-3) to determine "Which day is it in Brazil?"
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    
    // Normalized "Today" for the database: The start of the Brazil day (00:00:00) 
    const normalizedToday = new Date(todayStr + 'T00:00:00Z'); 

    try {
        // 1. Sync employees from Secullum (active/inactive)
        const secEmployees = await getEmployees();
        console.log(`[Nexus Engine v4] ${secEmployees.length} employees from Secullum`);
        await syncCollaborators(secEmployees);

        // 2. Get today's data from Secullum
        const [todayPunches, secAfastamentos] = await Promise.all([
            getPunches(todayStr, todayStr),
            getAfastamentos(todayStr, todayStr)
        ]);
        console.log(`[Nexus Engine v4] ${todayPunches.length} punches, ${secAfastamentos.length} afastamentos today`);

        // Sync punches to Workforce Hub
        try {
            await syncPunchesToWorkforce(todayStr, todayPunches);
        } catch (wfError: any) {
            console.error('[Nexus Engine] Failed to sync punches to Workforce Hub:', wfError.message);
        }

        // 3. Process each ACTIVE collaborator
        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });
        // Correct Mapping: JS (0=Sun, 1=Mon, 2=Tue) -> Secullum (0=Mon, 1=Tue...6=Sun)
        const dayOfWeek = (brazilNow.getDay() + 6) % 7; 

        for (const collab of collaborators) {
            if (!collab.secullumId) continue;

            const secEmp = secEmployees.find((e: any) => e.Id?.toString() === collab.secullumId);
            const cleanCollabPis = collab.pis?.replace(/\D/g, '') || '';

            // --- 1. AFASTAMENTO / FÉRIAS ---
            // Try matching by PIS/CPF
            let afast = secAfastamentos.find((a: any) => {
                const aPis = (a.NumeroPis || a.numeroPis || '').toString().replace(/\D/g, '');
                const aCpf = (a.Cpf || a.cpf || '').toString().replace(/\D/g, '');
                return (cleanCollabPis && (aPis === cleanCollabPis || aCpf === cleanCollabPis));
            });

            // Try matching by punch-text (Secullum specific behavior)
            const personPunches = todayPunches.filter((p: any) => 
                p.FuncionarioId?.toString() === collab.secullumId || 
                p.funcionarioId?.toString() === collab.secullumId
            );
            const punchText = (personPunches[0]?.Entrada1 || '').toString();
            const isTextLeave = punchText && !/^\d{2}:\d{2}$/.test(punchText);

            if (afast || isTextLeave) {
                const motivo = (afast?.Motivo || afast?.motivo || afast?.JustificativaNome || punchText || '').toUpperCase();
                const isFerias = motivo.includes('FERIAS');
                await prisma.collaborator.update({
                    where: { id: collab.id },
                    data: { status: isFerias ? 'FERIAS' : 'AFASTADO' }
                });
                continue;
            }

            // Secullum Dashboard "Trabalhando" logic
            // We ignore punches that are actually leave text (e.g. 'MATERN.', 'FERIAS')
            const realPunches = personPunches.filter((p: any) => {
                const timeStr = p.Entrada1 || '';
                return /^\d{2}:\d{2}$/.test(timeStr); // must match HH:mm
            });

            // Secullum Dashboard "Trabalhando" = Possui número ÍMPAR de batidas REAIS
            const isWorkingNow = realPunches.length > 0 && realPunches.length % 2 !== 0;

            if (isWorkingNow) {
                await prisma.collaborator.update({
                    where: { id: collab.id },
                    data: { status: 'TRABALHANDO' }
                });
            }

            // --- 3. DETERMINAR FALTANTE vs NA ESCALA vs FOLGA ---
            if (!isWorkingNow) {
                const scheduleNumero = secEmp?.Horario?.Numero as number;
                let hasScheduleToday = false;
                let events: Array<{ time: string; type: 'ENTRADA' | 'SAIDA' | 'INTERVALO_SAIDA' | 'INTERVALO_RETORNO' }> = [];

                if (scheduleNumero) {
                    let schedule = scheduleCache.get(scheduleNumero);
                    if (!schedule) {
                        try {
                            const result = await getScheduleByNumber(scheduleNumero);
                            schedule = Array.isArray(result) ? result[0] : result;
                            scheduleCache.set(scheduleNumero, schedule);
                        } catch { }
                    }

                    const todaySchedule = schedule?.Dias?.find((d: any) => d.DiaSemana === dayOfWeek);
                    if (todaySchedule && (todaySchedule.Entrada1 !== '00:00' || todaySchedule.Saida1 !== '00:00')) {
                        hasScheduleToday = true;
                        // [v5.0] TRACK ONLY ENTRADAS (As requested: Skip intervals and exits)
                        if (todaySchedule.Entrada1 && todaySchedule.Entrada1 !== '00:00') {
                            events.push({ time: todaySchedule.Entrada1, type: 'ENTRADA' });
                        }
                    }
                }

                // If no schedule for today -> FOLGA
                if (!hasScheduleToday) {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'FOLGA' }
                    });
                    continue;
                }

                // Process checkEvent for anyone with a schedule
                for (const event of events) {
                    await checkEvent(collab, event.time, event.type, brazilNow, todayPunches, collab.secullumId);
                }

                // Final status check based on cycles
                const cyclesToday = await prisma.alertCycle.findMany({
                    where: {
                        collaborator_id: collab.id,
                        date: normalizedToday
                    }
                });

                if (personPunches.length > 0 && realPunches.length % 2 === 0) {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'FOLGA' } 
                    });
                } else if (cyclesToday.some(c => c.status === 'EM_ALERTA' || c.status === 'ENCERRADO')) {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'FALTANTE' }
                    });
                } else {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'NA_ESCALA' }
                    });
                }
            }
        }

        // --- 4. TRIGGER DAILY SUPERVISOR REPORT (8:00 AM) ---
        await triggerYesterdayPendingReport(normalizedToday, brazilNow);

        return { success: true, timestamp: brazilNow };
    } catch (error: any) {
        console.error('[Nexus Engine v4] Critical failure:', error.message);
        throw error;
    }
}

function cleanPhoneNumber(phone: any): string | null {
    if (!phone) return null;
    let cleaned = phone.toString().replace(/\D/g, '');
    if (cleaned.length < 10) return null;
    
    // Se não tem DDI, adiciona 55 (Brasil)
    if (cleaned.length === 10 || cleaned.length === 11) {
        cleaned = '55' + cleaned;
    }
    
    return cleaned;
}

export async function syncCollaborators(secEmployees: any[]) {
    for (const empRaw of secEmployees) {
        const emp = empRaw as any;
        const secId = (emp.Id || emp.id || '').toString();
        const nomeFinal = (emp.Nome || emp.nome || 'Funcionario sem Nome').trim();

        if (!secId) continue;

        const isActive = !emp.Demissao;
        let finalPis = (emp.NumeroPis || emp.numeroPis || emp.Pis || emp.pis || '').toString() || null;
        let finalCpf = (emp.Cpf || emp.cpf || '').toString().replace(/\D/g, '') || null;

        // Evitar violação de restrição única para CPF
        if (finalCpf) {
            const existingWithCpf = await prisma.collaborator.findUnique({
                where: { cpf: finalCpf }
            });
            if (existingWithCpf && existingWithCpf.secullumId !== secId) {
                console.warn(`[Collaborator Sync] CPF ${finalCpf} já está em uso pelo colaborador secullumId ${existingWithCpf.secullumId}. Definindo como null para secullumId ${secId}.`);
                finalCpf = null;
            }
        }

        // Evitar violação de restrição única para PIS
        if (finalPis) {
            const existingWithPis = await prisma.collaborator.findUnique({
                where: { pis: finalPis }
            });
            if (existingWithPis && existingWithPis.secullumId !== secId) {
                console.warn(`[Collaborator Sync] PIS ${finalPis} já está em uso pelo colaborador secullumId ${existingWithPis.secullumId}. Definindo como null para secullumId ${secId}.`);
                finalPis = null;
            }
        }

        await prisma.collaborator.upsert({
            where: { secullumId: secId },
            update: {
                name: nomeFinal,
                active: isActive,
                pis: finalPis,
                cpf: finalCpf,
                phone: cleanPhoneNumber(emp.Celular || emp.Telefone),
                posto: emp.Empresa?.Nome || emp.empresaNome || 'Importado Secullum',
                departamento: emp.Departamento?.Descricao || null
            },
            create: {
                name: nomeFinal,
                secullumId: secId,
                pis: finalPis,
                cpf: finalCpf,
                active: isActive,
                phone: cleanPhoneNumber(emp.Celular || emp.Telefone),
                posto: emp.Empresa?.Nome || emp.empresaNome || 'Importado Secullum',
                departamento: emp.Departamento?.Descricao || null
            }
        });
    }
    console.log('[Nexus Engine v4] Collaborator sync complete.');
}

async function checkEvent(
    collab: any,
    expectedTimeStr: string,
    type: 'ENTRADA' | 'SAIDA' | 'INTERVALO_SAIDA' | 'INTERVALO_RETORNO',
    nowInBrazil: Date,
    punches: any[],
    secEmployeeId: string
) {
    const todayStr = format(nowInBrazil, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');
    const [hours, minutes] = expectedTimeStr.split(':').map(Number);
    
    // Construct expectedTime as UTC. 
    // Secullum says "08:00" (BRT), so we target "11:00" (UTC).
    const expectedTime = new Date(normalizedToday);
    expectedTime.setUTCHours(hours + 3, minutes, 0, 0);

    // [v4] Check for punch detection FIRST, regardless of time
    const punchDetected = punches.some((p: any) => {
        const empMatch = p.FuncionarioId?.toString() === secEmployeeId ||
                         p.funcionarioId?.toString() === secEmployeeId;
        
        if (!empMatch) return false;

        // Secullum 'Batidas' returns daily total columns: Entrada1, Saida1...
        const columns = [
            p.Entrada1, p.Saida1, p.Entrada2, p.Saida2, p.Entrada3, 
            p.Saida3, p.Entrada4, p.Saida4, p.Entrada5, p.Saida5
        ];

        return columns.some(val => {
            if (!val || typeof val !== 'string' || !val.includes(':')) return false;

            const [pHours, pMinutes] = val.split(':').map(Number);
            const punchTime = new Date(normalizedToday);
            // Again, Secullum HH:mm is BRT, so we map to UTC (+3h)
            punchTime.setUTCHours(pHours + 3, pMinutes, 0, 0);

            // Wide window for early/late punches: +/- 6 hours
            const isMatch = Math.abs(punchTime.getTime() - expectedTime.getTime()) < 6 * 60 * 60 * 1000;
            return isMatch;
        });
    });

    // Look for existing alert cycle for today
    let cycle = await prisma.alertCycle.findFirst({
        where: {
            collaborator_id: collab.id,
            date: normalizedToday,
            event_type: type,
            // When querying for existing, we must match the exactly constructed expectedTime
            expected_time: expectedTime
        }
    });

    // If punch detected, close any open cycle (including future ones)
    if (punchDetected) {
        if (cycle && ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'].includes(cycle.status)) {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'CONCLUIDO', completed_at: new Date() }
            });
        } else if (!cycle) {
            // Se ainda não existia o ciclo, mas já bateu, criamos concluído para o dashboard somar
            await prisma.alertCycle.create({
                data: {
                    collaborator_id: collab.id,
                    date: normalizedToday,
                    expected_time: expectedTime,
                    event_type: type,
                    status: 'CONCLUIDO',
                    completed_at: new Date(),
                    current_step: 0
                }
            });
        }
        return;
    }

    // [v4] If NO punch detected, check if we should create a PENDENTE or EM_ALERTA record
    const realNow = new Date();
    const diffMinutes = Math.floor((realNow.getTime() - expectedTime.getTime()) / 60000);

    if (!cycle) {
        // [v4] PROACTIVE: Create PENDENTE immediately for future events
        await prisma.alertCycle.create({
            data: {
                collaborator_id: collab.id,
                date: normalizedToday,
                expected_time: expectedTime,
                event_type: type,
                status: diffMinutes >= 5 ? 'EM_ALERTA' : 'PENDENTE',
                current_step: 0
            }
        });
        return;
    }

    // Auto-close after 90 minutes of no punch
    if (diffMinutes > 90) {
        if (cycle.status !== 'ENCERRADO' && cycle.status !== 'CONCLUIDO') {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'ENCERRADO', updated_at: new Date() }
            });
        }
        return;
    }

    // Escalation logic for active alerts
    if (diffMinutes >= 5 && (cycle.status === 'PENDENTE' || cycle.status === 'EM_ALERTA')) {
        if (cycle.status === 'PENDENTE') {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'EM_ALERTA' }
            });
        }

        // Escalation: 5min → Step 1, 15min → Step 2, 25min (15+10) → Step 3
        let targetStep = 0;
        if (diffMinutes >= 25) targetStep = 3;
        else if (diffMinutes >= 15) targetStep = 2;
        else if (diffMinutes >= 5) targetStep = 1;

        if (targetStep > cycle.current_step) {
            await triggerNexusAlert(collab, type, expectedTimeStr, targetStep, cycle.id);
        }
    }
}

async function triggerNexusAlert(
    collab: any,
    type: string,
    time: string,
    step: number,
    cycleId: string
) {
    const labels = ['1º AVISO', '2º AVISO', '3º AVISO'];
    const emoji = ['⚠️', '🚨', '🆘'];
    const banner = labels[step - 1];
    const icon = emoji[step - 1];

    const eventLabels: Record<string, string> = {
        ENTRADA: 'Entrada no Turno',
        INTERVALO_SAIDA: 'Saída para Intervalo',
        INTERVALO_RETORNO: 'Retorno do Intervalo',
        SAIDA: 'Saída do Turno'
    };

    const message = `${icon} *${banner} — NEXUS OPERACIONAL* ${icon}\n\n` +
        `👤 *Colaborador:* ${collab.name}\n` +
        `📍 *Posto:* ${collab.posto || 'Geral'}\n` +
        `🏢 *Depto:* ${collab.departamento || 'Não informado'}\n` +
        `🕒 *Evento:* ${eventLabels[type] || type}\n` +
        `⏰ *Horário Previsto:* ${time}\n` +
        `❌ *Batida não registrada no Secullum*\n\n` +
        `Verificar presença no local imediatamente! ⏱️`;

    // [v4.2] FILTER: Only send WhatsApp for FIRST PUNCH (ENTRADA)
    if (type !== 'ENTRADA') {
        console.log(`[Nexus] ⏭️ Alerta de ${type} ignorado (Filtro: Apenas Primeira Batida habilitado)`);
        // We still update the DB cycle so it shows as 'EM_ALERTA' in the table, but no WhatsApp sent.
        await prisma.alertCycle.update({
            where: { id: cycleId },
            data: {
                current_step: step,
                last_alert_at: new Date(),
                status: 'EM_ALERTA'
            }
        });
        return;
    }

    const success = await sendWhatsAppMessage('', message);
    
    // [v6.0] PRIVATE ALERT: If collaborator has a phone, send private message too
    if (success && collab.phone) {
        const privateMessage = `⚠️ Olá *${collab.name}*, notamos que você ainda não registrou sua ENTRADA hoje (prevista para as ${time}). Por favor, regularize seu ponto ou entre em contato com seu supervisor imediatamente. ⏱️`;
        await sendWhatsAppMessage(collab.phone, privateMessage);
    }

    if (success) {
        await prisma.alertCycle.update({
            where: { id: cycleId },
            data: {
                current_step: step,
                last_alert_at: new Date(),
                status: 'EM_ALERTA'
            }
        });
        console.log(`[Nexus] 📲 Alerta ${step} enviado: ${collab.name} - ${type}`);
    } else {
        console.error(`[Nexus] ❌ Falha ao enviar alerta ${step} para ${collab.name}`);
    }
}

async function triggerYesterdayPendingReport(normalizedToday: Date, brazilNow: Date) {
    const currentHour = parseInt(new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false
    }).format(new Date()), 10);
    
    // We only trigger this at 8:00 AM
    if (currentHour !== 8) return;

    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    
    // Check if we already sent this daily management report today
    const lastDailyReportDay = await prisma.nexusConfig.findUnique({ where: { key: 'LAST_YESTERDAY_REPORT_DAY' } });
    if (lastDailyReportDay?.value === todayStr) {
        return; 
    }

    console.log(`[Nexus] 📋 Generating Daily Supervisor Report (Yesterday Pendencies)...`);

    const yesterday = subDays(normalizedToday, 1);
    const yesterdayStr = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'UTC', // normalizedToday is already UTC 00:00
        day: '2-digit',
        month: '2-digit'
    }).format(yesterday);

    const pendingCycles = await prisma.alertCycle.findMany({
        where: {
            status: 'EM_ALERTA',
            date: yesterday,
            event_type: 'ENTRADA'
        },
        include: {
            collaborator: true
        },
        orderBy: [
            { collaborator: { posto: 'asc' } },
            { collaborator: { departamento: 'asc' } }
        ]
    });

    if (pendingCycles.length === 0) {
        console.log('[Nexus] ⏭️ No pending exceptions from yesterday to report.');
        // Still mark as sent to avoid repeated checks
        await prisma.nexusConfig.upsert({
            where: { key: 'LAST_YESTERDAY_REPORT_DAY' },
            update: { value: todayStr },
            create: { key: 'LAST_YESTERDAY_REPORT_DAY', value: todayStr }
        });
        return;
    }

    // Grouping
    const groups: Record<string, Record<string, any[]>> = {};
    pendingCycles.forEach(cycle => {
        const posto = cycle.collaborator?.posto || 'GERAL';
        const depto = cycle.collaborator?.departamento || 'NÃO INFORMADO';
        
        if (!groups[posto]) groups[posto] = {};
        if (!groups[posto][depto]) groups[posto][depto] = [];
        
        groups[posto][depto].push(cycle);
    });

    let message = `📋 *NEXUS — RELATÓRIO GERENCIAL* 📋\n` +
                  `⚠️ *PENDÊNCIAS DE ONTEM (${yesterdayStr})*\n` +
                  `━━━━━━━━━━━━━━━━━━━━━━\n` +
                  `Supervisores, favor providenciar as justificativas para as ausências abaixo no sistema:\n\n`;

    for (const [posto, deptos] of Object.entries(groups)) {
        message += `📍 *POSTO: ${posto.toUpperCase()}*\n`;
        for (const [depto, cycles] of Object.entries(deptos)) {
            message += `  • *${depto}*:\n`;
            cycles.forEach(c => {
                const timeStr = c.expected_time ? format(new Date(c.expected_time.getTime() - 3 * 60 * 60 * 1000), 'HH:mm') : '--:--';
                message += `    - ${c.collaborator?.name} (Entrada: ${timeStr})\n`;
            });
        }
        message += `\n`;
    }

    message += `🛑 *Total de Justificativas Pendentes: ${pendingCycles.length}*\n` +
               `🔗 _Link para lançamento: https://mesa-de-opera-es.vercel.app/dashboard_`;

    const success = await sendWhatsAppMessage('', message);
    
    if (success) {
        await prisma.nexusConfig.upsert({
            where: { key: 'LAST_YESTERDAY_REPORT_DAY' },
            update: { value: todayStr },
            create: { key: 'LAST_YESTERDAY_REPORT_DAY', value: todayStr }
        });
        console.log(`[Nexus] 📲 Daily Supervisor Report sent successfully.`);
    }
}

async function sendWorkforceWebhook(cpf: string, timestamp: string) {
    const url = process.env.WORKFORCE_API_URL || 'https://workforce-hub-henna.vercel.app/api/integration/nexus/clock-in';
    const token = process.env.WORKFORCE_INTEGRATION_TOKEN || 'nexus-default-token';

    console.log(`[Workforce Webhook] Sending punch for CPF: ${cpf}, Timestamp: ${timestamp}`);
    try {
        const response = await axios.post(url, {
            cpf,
            timestamp
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log(`[Workforce Webhook] Success: status ${response.status}`, response.data);
        return true;
    } catch (error: any) {
        console.error(`[Workforce Webhook] Failure:`, error.response?.data || error.message);
        return false;
    }
}

export async function syncPunchesToWorkforce(todayStr: string, todayPunches: any[]) {
    console.log(`[Workforce Sync] Processing ${todayPunches.length} punches for date ${todayStr}`);
    
    // Normalized start of day (UTC) for database matching
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');

    // Retrieve all active collaborators with CPFs
    const collaborators = await prisma.collaborator.findMany({
        where: {
            active: true,
            cpf: { not: null }
        }
    });

    const collabMap = new Map<string, any>();
    collaborators.forEach(c => {
        if (c.secullumId) {
            collabMap.set(c.secullumId, c);
        }
    });

    for (const punch of todayPunches) {
        const secEmployeeId = (punch.FuncionarioId || punch.funcionarioId || '').toString();
        if (!secEmployeeId) continue;

        const collab = collabMap.get(secEmployeeId);
        if (!collab || !collab.cpf) continue;

        // Secullum columns representing clock-ins/outs
        const columns = [
            'Entrada1', 'Saida1', 'Entrada2', 'Saida2', 
            'Entrada3', 'Saida3', 'Entrada4', 'Saida4', 
            'Entrada5', 'Saida5'
        ];

        for (const col of columns) {
            const val = punch[col];
            // Must be a valid time string in format HH:mm
            if (!val || typeof val !== 'string' || !val.includes(':')) continue;

            // Check if this punch was already processed and sent
            const alreadySent = await prisma.sentPunch.findUnique({
                where: {
                    collaboratorId_date_columnName_punchTime: {
                        collaboratorId: collab.id,
                        date: normalizedToday,
                        columnName: col,
                        punchTime: val
                    }
                }
            });

            if (alreadySent) continue;

            // Construct UTC ISO timestamp from Secullum's Brazil local time (UTC-3)
            const [pHours, pMinutes] = val.split(':').map(Number);
            const punchTimeUtc = new Date(normalizedToday);
            punchTimeUtc.setUTCHours(pHours + 3, pMinutes, 0, 0);
            const timestamp = punchTimeUtc.toISOString();

            // Send webhook
            const success = await sendWorkforceWebhook(collab.cpf, timestamp);

            // Record as sent in database if successful
            if (success) {
                try {
                    await prisma.sentPunch.create({
                        data: {
                            collaboratorId: collab.id,
                            date: normalizedToday,
                            columnName: col,
                            punchTime: val
                        }
                    });
                } catch (dbError) {
                    console.error('[Workforce Sync] Error saving SentPunch:', dbError);
                }
            }
        }
    }
    console.log('[Workforce Sync] Completed.');
}
