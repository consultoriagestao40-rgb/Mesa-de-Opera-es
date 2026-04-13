import prisma from '@/lib/prisma';
import { getEmployees, getScheduleByNumber, getPunches } from '@/lib/secullum-service';
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
        console.log(`[Nexus Engine v3] ${secEmployees.length} employees from Secullum`);
        await syncCollaborators(secEmployees);

        // 2. Get today's punches for everyone
        const todayPunches = await getPunches(todayStr, todayStr);
        console.log(`[Nexus Engine v3] ${todayPunches.length} punches today`);

        // 3. Process each ACTIVE collaborator
        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });
        const dayOfWeek = brazilNow.getDay(); // 0=Sunday, 1=Monday...

        for (const collab of collaborators) {
            if (!collab.secullumId) continue;

            // Find this employee's data from Secullum
            const secEmp = secEmployees.find((e: any) => e.Id?.toString() === collab.secullumId);
            if (!secEmp?.HorarioId || !secEmp?.Horario?.Numero) continue;

            const scheduleNumero = secEmp.Horario.Numero as number;

            // Get schedule with Dias (use cache to avoid repeated calls)
            let schedule = scheduleCache.get(scheduleNumero);
            if (!schedule) {
                try {
                    const result = await getScheduleByNumber(scheduleNumero);
                    // API may return an array
                    schedule = Array.isArray(result) ? result[0] : result;
                    scheduleCache.set(scheduleNumero, schedule);
                } catch {
                    continue; // skip if API fails for this schedule
                }
            }

            if (!schedule?.Dias) continue;

            const todaySchedule = schedule.Dias.find((d: any) => d.DiaSemana === dayOfWeek);
            if (!todaySchedule) continue;

            // Monitor all 4 event types
            const events: Array<{ time: string; type: 'ENTRADA' | 'SAIDA' | 'INTERVALO_SAIDA' | 'INTERVALO_RETORNO' }> = [];

            if (todaySchedule.Entrada1 && todaySchedule.Entrada1 !== '00:00')
                events.push({ time: todaySchedule.Entrada1, type: 'ENTRADA' });
            if (todaySchedule.Saida1 && todaySchedule.Saida1 !== '00:00')
                events.push({ time: todaySchedule.Saida1, type: 'INTERVALO_SAIDA' });
            if (todaySchedule.Entrada2 && todaySchedule.Entrada2 !== '00:00')
                events.push({ time: todaySchedule.Entrada2, type: 'INTERVALO_RETORNO' });
            if (todaySchedule.Saida2 && todaySchedule.Saida2 !== '00:00')
                events.push({ time: todaySchedule.Saida2, type: 'SAIDA' });

            for (const event of events) {
                await checkEvent(collab, event.time, event.type, brazilNow, todayPunches, collab.secullumId);
            }
        }

        return { success: true, timestamp: brazilNow };
    } catch (error: any) {
        console.error('[Nexus Engine v3] Critical failure:', error.message);
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
                posto: emp.Empresa?.Nome || emp.empresaNome || 'Importado Secullum'
            },
            create: {
                name: nomeFinal,
                secullumId: secId,
                pis: (emp.Pis || emp.pis || '').toString() || null,
                active: isActive,
                posto: emp.Empresa?.Nome || emp.empresaNome || 'Importado Secullum'
            }
        });
    }
    console.log('[Nexus Engine v3] Collaborator sync complete.');
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
    const expectedTime = new Date(now);
    expectedTime.setHours(hours, minutes, 0, 0);

    // Only monitor events that are in the past (past expected time)
    if (now < expectedTime) return;

    // Check if there's a punch in the Secullum data
    const punchDetected = punches.some((p: any) => {
        const pDate = new Date(p.Data || p.DataHora);
        const empMatch = p.FuncionarioId?.toString() === secEmployeeId ||
                         p.funcionarioId?.toString() === secEmployeeId;
        return empMatch &&
               isAfter(pDate, addMinutes(expectedTime, -30)) &&
               isBefore(pDate, addMinutes(expectedTime, 360));
    });

    // Look for existing alert cycle for today
    let cycle = await prisma.alertCycle.findFirst({
        where: {
            collaborator_id: collab.id,
            date: { gte: startOfDay(now), lte: endOfDay(now) },
            event_type: type,
            expected_time: expectedTime
        }
    });

    // If punch detected, close any open cycle
    if (punchDetected) {
        if (cycle && ['PENDENTE', 'EM_ALERTA'].includes(cycle.status)) {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'CONCLUIDO', completed_at: new Date() }
            });
            console.log(`[Nexus] ✅ Batida OK: ${collab.name} - ${type}`);
        }
        return;
    }

    const diffMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);

    // Only create/escalate if past tolerance (5 min)
    if (diffMinutes < 5) return;

    // Auto-close after 90 minutes of no punch
    if (diffMinutes > 90) {
        if (cycle && cycle.status !== 'ENCERRADO') {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'ENCERRADO', updated_at: new Date() }
            });
        }
        return;
    }

    // Create cycle if doesn't exist
    if (!cycle) {
        cycle = await prisma.alertCycle.create({
            data: {
                collaborator_id: collab.id,
                date: now,
                expected_time: expectedTime,
                event_type: type,
                status: 'EM_ALERTA',
                current_step: 0
            }
        });
    }

    if (['CONCLUIDO', 'CANCELADO', 'ENCERRADO'].includes(cycle.status)) return;

    // Escalation: 5min → Step 1, 20min → Step 2, 40min → Step 3
    let targetStep = 0;
    if (diffMinutes >= 40) targetStep = 3;
    else if (diffMinutes >= 20) targetStep = 2;
    else if (diffMinutes >= 5) targetStep = 1;

    if (targetStep > cycle.current_step) {
        await triggerNexusAlert(collab, type, expectedTimeStr, targetStep, cycle.id);
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
