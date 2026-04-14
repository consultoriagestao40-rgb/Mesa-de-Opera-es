import prisma from '../lib/prisma';

async function run() {
    const cycles = await prisma.alertCycle.findMany({
        where: { date: new Date('2026-04-14T00:00:00.000Z') }
    });
    
    const stats: any = {};
    cycles.forEach(c => {
        stats[c.status] = (stats[c.status] || 0) + 1;
    });
    console.log('Statuses count for today:', stats);
}
run();
