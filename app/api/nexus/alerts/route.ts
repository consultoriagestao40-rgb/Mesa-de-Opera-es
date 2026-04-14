import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        
        const now = new Date();
        // Base date for filtering
        let targetDate = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Default to Brazil Today
        
        if (dateParam) {
            targetDate = new Date(dateParam + 'T12:00:00'); // Use mid-day to avoid TZ shifts
        }

        const activeCycles = await prisma.alertCycle.findMany({
            where: {
                status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'] }, // Focus ONLY on what needs action or expired
                date: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                }
            },
            include: {
                collaborator: true
            },
            orderBy: {
                expected_time: 'desc'
            }
        });

        // Summary Statistics for the specific day
        const allActiveCollaborators = await prisma.collaborator.count({ where: { active: true } });
        
        // 1. Total Scheduled (Unique collaborators with any AlertCycle today)
        const scheduledGroups = await prisma.alertCycle.groupBy({
            by: ['collaborator_id'],
            where: {
                date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
            }
        });
        const totalScheduled = scheduledGroups.length;

        // 2. Total Present (Unique collaborators with at least one CONCLUIDO cycle today)
        const presentGroups = await prisma.alertCycle.groupBy({
            by: ['collaborator_id'],
            where: {
                status: 'CONCLUIDO',
                date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
            }
        });
        const totalPresent = presentGroups.length;

        // 3. Total Punches (All CONCLUIDO cycles today)
        const totalPunches = await prisma.alertCycle.count({
            where: {
                status: 'CONCLUIDO',
                date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
            }
        });

        // 4. Total Exceptions (All non-CONCLUIDO cycles in the current monitor list)
        const totalExceptions = activeCycles.length;

        // 5. Total Off Duty (Active collaborators not in today's schedule)
        const totalOff = Math.max(0, allActiveCollaborators - totalScheduled);

        return NextResponse.json({ 
            cycles: activeCycles,
            stats: {
                totalActive: allActiveCollaborators,
                scheduled: totalScheduled,
                present: totalPresent,
                punches: totalPunches,
                exceptions: totalExceptions,
                offDuty: totalOff
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
