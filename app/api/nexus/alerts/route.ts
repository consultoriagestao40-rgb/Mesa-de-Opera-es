import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        
        const activeCycles = await prisma.alertCycle.findMany({
            where: {
                status: { in: ['PENDENTE', 'EM_ALERTA'] },
                date: {
                    gte: startOfDay(brazilNow),
                    lte: endOfDay(brazilNow)
                }
            },
            include: {
                collaborator: true
            },
            orderBy: {
                expected_time: 'desc'
            }
        });

        // Summary Statistics
        const totalCollaborators = await prisma.collaborator.count({ where: { active: true } });
        const completedToday = await prisma.alertCycle.count({
            where: {
                status: 'CONCLUIDO',
                date: { gte: startOfDay(brazilNow), lte: endOfDay(brazilNow) }
            }
        });
        const alertsActive = activeCycles.filter(c => c.status === 'EM_ALERTA').length;

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
