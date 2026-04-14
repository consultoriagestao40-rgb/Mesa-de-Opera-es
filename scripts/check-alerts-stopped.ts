import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function check() {
    const today = new Date();
    const cycles = await prisma.alertCycle.findMany({
        where: {
            date: { gte: startOfDay(today), lte: endOfDay(today) },
            last_alert_at: { not: null }
        },
        orderBy: { last_alert_at: 'desc' },
        take: 10
    });

    console.log('--- ÚLTIMOS ALERTAS ENVIADOS HOJE ---');
    cycles.forEach(c => {
        console.log(`- [${c.last_alert_at?.toISOString()}] ${c.status} | Id: ${c.id} | Step: ${c.current_step}`);
    });
}
check();
