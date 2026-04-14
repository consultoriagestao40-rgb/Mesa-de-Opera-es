import prisma from '../lib/prisma';
import { processNexusCycle } from '../lib/nexus-engine';
import { format } from 'date-fns';

async function run() {
    console.log('--- WIPE AND SYNC TODAY (RESTORE INTEGRITY) ---');
    
    // 1. Identify Today
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');
    
    console.log('Today:', todayStr);
    console.log('Normalized (UTC):', normalizedToday.toISOString());

    // 2. Wipe everything for today
    const deleted = await prisma.alertCycle.deleteMany({
        where: { date: normalizedToday }
    });
    console.log(`Deleted ${deleted.count} corrupted/placeholder cycles for today.`);

    // 3. Trigger fresh sync with FIXED logic
    console.log('Starting fresh sync with correct day mapping...');
    await processNexusCycle();
    
    console.log('--- DONE ---');
}
run().catch(console.error);
