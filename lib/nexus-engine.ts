import prisma from '@/lib/prisma';
import { getEmployees, getSchedules, getPunches } from '@/lib/secullum-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay } from 'date-fns';

/**
 * Nexus Engine v2.0
 * 
 * Core monitoring logic integrated with Secullum Ponto Web.
 * Executes automated check cycles and transitions AlertCycles.
 */

export async function processNexusCycle() {
    console.log('[Nexus Engine] Starting cycle process...');

    const now = new Date();
    // Adjustment to Brazil Time (Next server usually UTC)
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');

    try {
        // 1. Fetch Secullum Source Data
        const [secEmployees, secSchedules, todayPunches] = await Promise.all([
            getEmployees(),
            getSchedules(),
            getPunches(todayStr, todayStr)
        ]);

        console.log(`[Nexus Engine] Data synced: ${secEmployees.length} employees, ${secSchedules.length} schedules.`);

        // 2. Automate Collaborator Sync
        await syncCollaborators(secEmployees);

        // 3. Process each active collaborator
        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });

        for (const collab of collaborators) {
            if (!collab.secullumId) continue;

            // Find employee data to get their schedule ID
            const secEmp = secEmployees.find((e: any) => e.Id === collab.secullumId);
            if (!secEmp || !secEmp.HorarioId) continue;

            // Find the specific schedule
            const schedule = secSchedules.find((s: any) => s.Id === secEmp.HorarioId);
            if (!schedule) continue;

            // Determine if employee should work today and at what time
            const dayOfWeek = brazilNow.getDay(); 
            const todaySchedule = schedule.Dias?.find((d: any) => d.DiaSemana === dayOfWeek);
            
            // Skip if no work scheduled for today or no entry time defined
            if (!todaySchedule || !todaySchedule.Entrada1 || todaySchedule.Entrada1 === '00:00') continue;

            // Execute logic for Entry 1 (Principal monitor)
            await checkEvent(collab, todaySchedule.Entrada1, 'ENTRADA', brazilNow, todayPunches, secEmp.Id);
            
            // Note: We can expand this for INTERVALO_SAIDA, etc.
        }

        return { success: true, timestamp: brazilNow };
    } catch (error: any) {
        console.error('[Nexus Engine] Critical failure:', error.message);
        throw error;
    }
}

/**
 * Ensures collaborators from Secullum exist in our DB if they have a pis/secullumId.
 */
export async function syncCollaborators(secEmployees: any[]) {
    console.log(`[Nexus Engine] Syncing ${secEmployees.length} employees...`);
    
    for (const emp of secEmployees) {
        // Use Secullum Id as unique identifier
        const secId = emp.Id?.toString();
        if (!secId) continue;

        await prisma.collaborator.upsert({
            where: { secullumId: secId },
            update: {
                name: emp.Nome,
                active: emp.Ativo !== false,
                pis: emp.Pis || null
            },
            create: {
                name: emp.Nome,
                secullumId: secId,
                pis: emp.Pis || null,
                active: true,
                posto: 'Importado Secullum'
            }
        });
    }
    
    console.log('[Nexus Engine] Sync complete.');
}

async function checkEvent(
    collab: any, 
    expectedTimeStr: string, 
    type: 'ENTRADA' | 'SAIDA' | 'INTERVALO_SAIDA' | 'INTERVALO_RETORNO',
    now: Date,
    punches: any[],
    secEmployeeId: string
) {
    const [hours, minutes] = expectedTimeStr.split(':');
    const expectedTime = new Date(now);
    expectedTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // 1. Check if punch exists in Secullum for today for this event
    const punchDetected = punches.some((p: any) => {
        const pDate = new Date(p.Data);
        // We look for a punch within 30 min before and 6h after the expected time
        return p.FuncionarioId === secEmployeeId && 
               isAfter(pDate, addMinutes(expectedTime, -30)) && 
               isBefore(pDate, addMinutes(expectedTime, 360));
    });

    // 2. Fetch or Init Alert Cycle
    let cycle = await prisma.alertCycle.findFirst({
        where: {
            collaborator_id: collab.id,
            date: { gte: startOfDay(now), lte: endOfDay(now) },
            event_type: type,
            // Match expected time specifically 
            expected_time: expectedTime
        }
    });

    if (punchDetected) {
        if (cycle && (cycle.status === 'PENDENTE' || cycle.status === 'EM_ALERTA')) {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'CONCLUIDO', completed_at: new Date() }
            });
            console.log(`[Nexus] Batida detectada para ${collab.name}. Ciclo encerrado.`);
        }
        return;
    }

    // 3. Logic for ALERTS if punch not detected
    const diffMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);

    // If we are past the expected time + tolerance (5 min)
    if (diffMinutes >= 5) {
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

        // Cycle guards
        if (['CONCLUIDO', 'CANCELADO', 'ENCERRADO'].includes(cycle.status)) return;

        // Transition Logic: 5 min -> Step 1, 15 min -> Step 2, 25 min -> Step 3
        let targetStep = 0;
        if (diffMinutes >= 25) targetStep = 3;
        else if (diffMinutes >= 15) targetStep = 2;
        else if (diffMinutes >= 5) targetStep = 1;

        if (targetStep > cycle.current_step) {
            await triggerNexusAlert(collab, type, expectedTimeStr, targetStep, cycle.id);
        }

        // Automatic closure after 45 minutes of silence
        if (diffMinutes > 45 && cycle.status !== 'ENCERRADO') {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'ENCERRADO', updated_at: new Date() }
            });
        }
    }
}

async function triggerNexusAlert(collab: any, type: string, time: string, step: number, cycleId: string) {
    const labels = ['1º AVISO', '2º AVISO', '3º AVISO'];
    const banner = labels[step - 1];

    const message = `🚨 *${banner}: NEXUS OPERACIONAL* 🚨\n\n` +
        `👤 *Colaborador:* ${collab.name}\n` +
        `📍 *Posto:* ${collab.posto || 'Geral'}\n` +
        `🕒 *Evento:* ${type} (${time})\n` +
        `⚠️ *Status:* Batida não realizada no Secullum.\n\n` +
        `Favor verificar no local agora! ⏱️`;

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
        console.log(`[Nexus] Alerta ${step} enviado para ${collab.name}`);
    }
}
