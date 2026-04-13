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
                status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO', 'CONCLUIDO'] }, // Show everything for historical view
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
        const totalCollaborators = await prisma.collaborator.count({ where: { active: true } });
        const completedOnDay = await prisma.alertCycle.count({
            where: {
                status: 'CONCLUIDO',
                date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
            }
        });
        const alertsOnDay = activeCycles.filter(c => c.status === 'EM_ALERTA').length;

        return NextResponse.json({ 
            cycles: activeCycles,
            stats: {
                total: totalCollaborators,
                completed: completedToday,
                alerts: alertsActive
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
