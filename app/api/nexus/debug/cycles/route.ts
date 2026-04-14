import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
    try {
        const now = new Date();
        const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        
        const cycles = await prisma.alertCycle.findMany({
            where: {
                date: {
                    gte: startOfDay(brazilNow),
                    lte: endOfDay(brazilNow)
                }
            },
            include: { collaborator: true }
        });

        const allCyclesRaw = await prisma.alertCycle.findMany({
            take: 20,
            orderBy: { created_at: 'desc' },
            include: { collaborator: true }
        });

        return NextResponse.json({ 
            countToday: cycles.length,
            cyclesToday: cycles,
            allCyclesRaw 
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message });
    }
}
