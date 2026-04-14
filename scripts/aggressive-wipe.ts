import prisma from '../lib/prisma';
import { processNexusCycle } from '../lib/nexus-engine';
import { format } from 'date-fns';

async function run() {
    console.log('--- AGGRESSIVE WIPE AND RESTORE ---');
    
    // 1. Clear everything from the last 24 hours to be absolutely sure
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const yesterdayUTC = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const deleted = await prisma.alertCycle.deleteMany({
        where: {
            date: { gte: yesterdayUTC }
        }
    });
    console.log(`Deleted ${deleted.count} cycles from the last 24h.`);

    // 2. Trigger fresh sync
    console.log('Running engine cycle with pure Secullum data...');
    await processNexusCycle();
    
    // 3. Final Check on JAYSSON
    const cycles = await prisma.alertCycle.findMany({
        where: { collaborator: { name: { contains: 'JAYSSON' } } },
        orderBy: { id: 'desc' },
        take: 3
    });
    console.log('JAYSSON AFTER SYNC:');
    cycles.forEach(c => {
         const brtTime = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(c.expected_time);
         console.log(`- Expected: ${brtTime} | Status: ${c.status} | Date: ${c.date.toISOString()}`);
    });
}
run();
