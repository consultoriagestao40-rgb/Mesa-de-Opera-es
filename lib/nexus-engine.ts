import prisma from '@/lib/prisma';
import { getEmployees, getSchedules, getPunches } from '@/lib/secullum-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { format, isAfter, isBefore, addMinutes, startOfDay, endOfDay } from 'date-fns';

/**
 * Nexus Engine
 * 
 * Core logic for the Nexus Operacional monitoring system.
 * Crosses data from Secullum with the defined alert cycles.
 */

const ALERT_THRESHOLDS = [5, 15, 25]; // Minutes after expected time

export async function processNexusCycle() {
    console.log('[Nexus Engine] Starting cycle process...');

    const now = new Date();
    // Brazil time adjustment (Vercel uses UTC)
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const startOfToday = startOfDay(brazilNow);
    const endOfToday = endOfDay(brazilNow);

    try {
        // 1. Fetch Secullum Data
        const [secEmployees, secSchedules, todayPunches] = await Promise.all([
            getEmployees(),
            getSchedules(),
            getPunches(todayStr, todayStr)
        ]);

        // 2. Sync Collaborators from Secullum to Local DB if missing
        // (Optional: we could do a full sync, but let's assume they are already in DB)
        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });

        for (const collab of collaborators) {
            const secEmp = secEmployees.find((e: any) => e.Id === collab.secullumId || e.Pis === collab.pis);
            if (!secEmp || !secEmp.HorarioId) continue;

            const schedule = secSchedules.find((s: any) => s.Id === secEmp.HorarioId);
            if (!schedule) continue;

            const dayOfWeek = brazilNow.getDay(); 
            const todaySchedule = schedule.Dias?.find((d: any) => d.DiaSemana === dayOfWeek);
            
            if (!todaySchedule || !todaySchedule.Entrada1) continue;

            // --- ENTRY CHECK ---
            await checkEvent(collab, todaySchedule.Entrada1, 'ENTRADA', brazilNow, todayPunches, secEmp.Id);
            
            // --- BREAK CHECK (If needed) ---
            if (todaySchedule.Saida1 && todaySchedule.Entrada2) {
                // await checkEvent(collab, todaySchedule.Saida1, 'INTERVALO_SAIDA', ...);
            }
        }

        return { success: true };
    } catch (error: any) {
        console.error('[Nexus Engine] Cycle failed:', error.message);
        throw error;
    }
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

    // 1. Check if punch already exists in Secullum for this event
    // (Simplified: check if any punch exists near the expected time for today)
    const punchDetected = punches.some((p: any) => {
        const pDate = new Date(p.Data);
        return p.FuncionarioId === secEmployeeId && 
               isAfter(pDate, addMinutes(expectedTime, -30)) && // 30 min before
               isBefore(pDate, addMinutes(expectedTime, 120));   // or up to 2h after?
    });

    // 2. Fetch or Create Alert Cycle
    let cycle = await prisma.alertCycle.findFirst({
        where: {
            collaborator_id: collab.id,
            date: { gte: startOfDay(now), lte: endOfDay(now) },
            event_type: type,
            expected_time: expectedTime
        }
    });

    if (punchDetected) {
        if (cycle && (cycle.status === 'PENDENTE' || cycle.status === 'EM_ALERTA')) {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'CONCLUIDO', completed_at: new Date() }
            });
            console.log(`[Nexus] Cycle completed for ${collab.name} (${type})`);
        }
        return;
    }

    // 3. Punch NOT detected. Check if we need to trigger alerts.
    const diffMinutes = Math.floor((now.getTime() - expectedTime.getTime()) / 60000);

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

        if (cycle.status === 'CONCLUIDO' || cycle.status === 'CANCELADO' || cycle.status === 'ENCERRADO') return;

        // Sequence: 5min (Step 1), 15min (Step 2), 25min (Step 3)
        let nextStep = 0;
        if (diffMinutes >= 25 && cycle.current_step < 3) nextStep = 3;
        else if (diffMinutes >= 15 && cycle.current_step < 2) nextStep = 2;
        else if (diffMinutes >= 5 && cycle.current_step < 1) nextStep = 1;

        if (nextStep > cycle.current_step) {
            await triggerAlert(collab, type, expectedTimeStr, nextStep, cycle.id);
        }
        
        // Final closure after 35 minutes
        if (diffMinutes > 35 && cycle.status !== 'ENCERRADO') {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'ENCERRADO' }
            });
        }
    }
}

async function triggerAlert(collab: any, type: string, time: string, step: number, cycleId: string) {
    const alertNames = ['1º AVISO', '2º AVISO', '3º AVISO'];
    const label = alertNames[step - 1];

    const message = `🚨 *${label}: NEXUS OPERACIONAL* 🚨\n\n` +
        `👤 *Colaborador:* ${collab.name}\n` +
        `📍 *Posto:* ${collab.posto || 'Não informado'}\n` +
        `🕒 *Evento:* ${type} (${time})\n` +
        `⚠️ *Status:* Batida de ponto não identificada no Secullum.\n\n` +
        `Favor verificar imediatamente! ⏱️`;

    try {
        await sendWhatsAppMessage(message);
        await prisma.alertCycle.update({
            where: { id: cycleId },
            data: { 
                current_step: step,
                last_alert_at: new Date(),
                status: 'EM_ALERTA'
            }
        });
        console.log(`[Nexus] Alert ${step} sent for ${collab.name}`);
    } catch (err) {
        console.error(`[Nexus] Failed to send alert for ${collab.name}:`, err);
    }
}
