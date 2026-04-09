import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getEmployees, getSchedules, getPunches } from '@/lib/secullum-service';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';
import { format, subMinutes, isAfter, isBefore, startOfDay, endOfDay } from 'date-fns';

/**
 * Monitoring Route: Checks for missing clock-ins (attendance) in Secullum
 * and sends WhatsApp alerts.
 * 
 * Frequency: Every 5-10 minutes.
 */

const TOLERANCE_MINUTES = 15; // Delay allowed before alerting

export async function GET(request: NextRequest) {
    // Basic Security Check (Optional: check for CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // In local dev, we might skip this for testing
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        console.log('[Attendance] Starting routine check...');

        // 1. Get current time in Brazil (Vercel is UTC, Brazil is -3h)
        const nowUTC = new Date();
        const now = new Date(nowUTC.getTime() - 3 * 60 * 60 * 1000); 
        
        const todayStr = format(now, 'yyyy-MM-dd');
        const startOfToday = startOfDay(now);
        const endOfToday = endOfDay(now);

        // 2. Fetch Active Cleaners with Secullum data
        const cleaners = await prisma.cleaner.findMany({
            where: {
                active: true,
                OR: [
                    { secullumId: { not: null } },
                    { pis: { not: null } }
                ]
            }
        });

        if (cleaners.length === 0) {
            return NextResponse.json({ message: 'No cleaners configured with Secullum IDs' });
        }

        // 3. Fetch Data from Secullum
        // Note: For large volumes, we might need pagination or careful syncing
        const [secullumEmployees, secullumSchedules, todayPunches] = await Promise.all([
            getEmployees(),
            getSchedules(),
            getPunches(todayStr, todayStr)
        ]);

        console.log(`[Attendance] Data fetched: ${secullumEmployees.length} employees, ${todayPunches.length} punches today.`);

        const alertsSent = [];

        // 4. Process each cleaner
        for (const cleaner of cleaners) {
            // Find Secullum mapping
            const secEmployee = secullumEmployees.find((e: any) => 
                (cleaner.secullumId && e.Id === cleaner.secullumId) || 
                (cleaner.pis && e.Pis === cleaner.pis)
            );

            if (!secEmployee || !secEmployee.HorarioId) continue;

            // Find the schedule details
            const schedule = secullumSchedules.find((s: any) => s.Id === secEmployee.HorarioId);
            if (!schedule) continue;

            // Determine expected start time for today (Simplified logic)
            // Secullum API Horario usually has entry times per day of week
            const dayOfWeek = now.getDay(); // 0-6 (Sun-Sat)
            const scheduleForToday = schedule.Dias?.find((d: any) => d.DiaSemana === dayOfWeek);
            
            if (!scheduleForToday || !scheduleForToday.Entrada1) continue;

            // Construct full Date for expected entry
            const [hours, minutes] = scheduleForToday.Entrada1.split(':');
            const expectedEntry = new Date(now);
            expectedEntry.setHours(parseInt(hours), parseInt(minutes), 0, 0);

            // Check if shift has already started and passed the tolerance
            const limitTime = new Date(expectedEntry.getTime() + TOLERANCE_MINUTES * 60000);

            if (isAfter(now, limitTime)) {
                // Check if they already clocked in today
                const hasPunchedIn = todayPunches.some((p: any) => 
                    p.FuncionarioId === secEmployee.Id && 
                    isAfter(new Date(p.Data), startOfToday) &&
                    isBefore(new Date(p.Data), endOfToday)
                );

                if (!hasPunchedIn) {
                    // Check if we already sent an alert for this specific shift today
                    const existingAlert = await prisma.attendanceAlert.findFirst({
                        where: {
                            cleaner_id: cleaner.id,
                            shift_start: expectedEntry,
                            date: {
                                gte: startOfToday,
                                lte: endOfToday
                            }
                        }
                    });

                    if (!existingAlert) {
                        // SEND ALERT!
                        const message = `🚨 *FALTA DE REGISTRO DE PONTO* 🚨\n\n` +
                            `👤 *Colaborador:* ${cleaner.name}\n` +
                            `🕒 *Início Previsto:* ${scheduleForToday.Entrada1}\n` +
                            `📢 *Status:* Não identificado no Secullum até agora (${TOLERANCE_MINUTES} min de tolerância).\n\n` +
                            `Favor verificar com o colaborador! 🚌⏱️`;

                        await sendWhatsAppMessage(message);
                        
                        // Log the alert
                        await prisma.attendanceAlert.create({
                            data: {
                                cleaner_id: cleaner.id,
                                shift_start: expectedEntry,
                                date: now
                            }
                        });

                        alertsSent.push(cleaner.name);
                        console.log(`[Attendance] Alert sent for ${cleaner.name}`);
                    }
                }
            }
        }

        return NextResponse.json({
            success: true,
            alerts_triggered: alertsSent.length,
            cleaners_notified: alertsSent
        });

    } catch (error: any) {
        console.error('[Attendance] Routine check failed:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
