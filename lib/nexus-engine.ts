import prisma from '@/lib/prisma';
import { getEmployees, getScheduleByNumber, getPunches, getAfastamentos } from '@/lib/secullum-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay } from 'date-fns';

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
    // Adjust to Brazil Time (UTC-3)
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');

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

        // 3. Process each ACTIVE collaborator
        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });
        const dayOfWeek = brazilNow.getDay(); 

        for (const collab of collaborators) {
            if (!collab.secullumId) continue;

            const secEmp = secEmployees.find((e: any) => e.Id?.toString() === collab.secullumId);
            const afast = secAfastamentos.find((a: any) => {
                const aPis = (a.NumeroPis || a.numeroPis || '').toString();
                const aCpf = (a.Cpf || a.cpf || '').toString();
                return (aPis && aPis === collab.pis) || (aCpf && aCpf === collab.pis);
            });

            // --- 1. AFASTAMENTO / FÉRIAS ---
            if (afast) {
                const motivo = (afast.Motivo || afast.motivo || '').toUpperCase();
                const isFerias = motivo.includes('FERIAS');
                await prisma.collaborator.update({
                    where: { id: collab.id },
                    data: { status: isFerias ? 'FERIAS' : 'AFASTADO' }
                });
                continue;
            }

            // --- 2. TRABALHANDO (Qualquer batida = Trabalhando) ---
            const hasPunchRaw = todayPunches.some((p: any) => 
                p.FuncionarioId?.toString() === collab.secullumId || 
                p.funcionarioId?.toString() === collab.secullumId
            );

            if (hasPunchRaw) {
                await prisma.collaborator.update({
                    where: { id: collab.id },
                    data: { status: 'TRABALHANDO' }
                });
                // We still process cycles to reconcile punches, but the state is Working
            }

            // --- 3. ESCALA E MONITORAMENTO ---
            if (!secEmp?.HorarioId || !secEmp?.Horario?.Numero) {
                if (!hasPunchRaw) {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'FOLGA' }
                    });
                }
                continue;
            }

            const scheduleNumero = secEmp.Horario.Numero as number;
            let schedule = scheduleCache.get(scheduleNumero);
            if (!schedule) {
                try {
                    const result = await getScheduleByNumber(scheduleNumero);
                    schedule = Array.isArray(result) ? result[0] : result;
                    scheduleCache.set(scheduleNumero, schedule);
                } catch { continue; }
            }

            const todaySchedule = schedule?.Dias?.find((d: any) => d.DiaSemana === dayOfWeek);
            if (!todaySchedule) {
                if (!hasPunchRaw) {
                    await prisma.collaborator.update({
                        where: { id: collab.id },
                        data: { status: 'FOLGA' }
                    });
                }
                continue;
            }

            // Process actual events for cycles
            const events: Array<{ time: string; type: 'ENTRADA' | 'SAIDA' | 'INTERVALO_SAIDA' | 'INTERVALO_RETORNO' }> = [];
            if (todaySchedule.Entrada1 && todaySchedule.Entrada1 !== '00:00') events.push({ time: todaySchedule.Entrada1, type: 'ENTRADA' });
            if (todaySchedule.Saida1 && todaySchedule.Saida1 !== '00:00') events.push({ time: todaySchedule.Saida1, type: 'INTERVALO_SAIDA' });
            if (todaySchedule.Entrada2 && todaySchedule.Entrada2 !== '00:00') events.push({ time: todaySchedule.Entrada2, type: 'INTERVALO_RETORNO' });
            if (todaySchedule.Saida2 && todaySchedule.Saida2 !== '00:00') events.push({ time: todaySchedule.Saida2, type: 'SAIDA' });

            for (const event of events) {
                await checkEvent(collab, event.time, event.type, brazilNow, todayPunches, collab.secullumId);
            }

            // --- 4. DETERMINAR FALTANTE vs NA ESCALA ---
            if (!hasPunchRaw) {
                const cyclesToday = await prisma.alertCycle.findMany({
                    where: {
                        collaborator_id: collab.id,
                        date: { gte: startOfDay(brazilNow), lte: endOfDay(brazilNow) }
                    }
                });

                // Se houver qualquer ciclo 'EM_ALERTA' ou 'ENCERRADO', é Faltante
                if (cyclesToday.some(c => c.status === 'EM_ALERTA' || c.status === 'ENCERRADO')) {
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

        return { success: true, timestamp: brazilNow };
    } catch (error: any) {
        console.error('[Nexus Engine v4] Critical failure:', error.message);
        throw error;
    }
}

/**
 * Sync collaborators from Secullum, marking dismissed/invisible as inactive.
 */
export async function syncCollaborators(secEmployees: any[]) {
    for (const empRaw of secEmployees) {
        const emp = empRaw as any;
        const secId = (emp.Id || emp.id || '').toString();
        const nomeFinal = (emp.Nome || emp.nome || 'Funcionario sem Nome').trim();

        if (!secId) continue;

        const isActive = !emp.Demissao && emp.Invisivel !== true;

        await prisma.collaborator.upsert({
            where: { secullumId: secId },
            update: {
                name: nomeFinal,
                active: isActive,
                pis: (emp.Pis || emp.pis || '').toString() || null,
                posto: emp.Empresa?.Nome || emp.empresaNome || 'Importado Secullum',
                departamento: emp.Departamento?.Descricao || null
            },
            create: {
                name: nomeFinal,
                secullumId: secId,
                pis: (emp.Pis || emp.pis || '').toString() || null,
                active: isActive,
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
    now: Date,
    punches: any[],
    secEmployeeId: string
) {
    const [hours, minutes] = expectedTimeStr.split(':').map(Number);
    
    // Construct expectedTime in UTC. 
    // Secullum says "08:00" (BRT), so we target "11:00" (UTC).
    const expectedTime = new Date(now);
    expectedTime.setHours(hours + 3, minutes, 0, 0);

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
            const punchTime = new Date(expectedTime);
            // Again, Secullum HH:mm is BRT, so we map to UTC (+3h)
            punchTime.setHours(pHours + 3, pMinutes, 0, 0);

            // Wide window for early/late punches: +/- 6 hours
            const isMatch = Math.abs(punchTime.getTime() - expectedTime.getTime()) < 6 * 60 * 60 * 1000;
            return isMatch;
        });
    });

    // Look for existing alert cycle for today
    let cycle = await prisma.alertCycle.findFirst({
        where: {
            collaborator_id: collab.id,
            date: { gte: startOfDay(now), lte: endOfDay(now) },
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
                    date: now,
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
    const diffMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);

    if (!cycle) {
        // [v4] PROACTIVE: Create PENDENTE immediately for future events
        await prisma.alertCycle.create({
            data: {
                collaborator_id: collab.id,
                date: now,
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

        // Escalation: 5min → Step 1, 20min → Step 2, 40min → Step 3
        let targetStep = 0;
        if (diffMinutes >= 40) targetStep = 3;
        else if (diffMinutes >= 20) targetStep = 2;
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

    const success = await sendWhatsAppMessage('', message);

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
