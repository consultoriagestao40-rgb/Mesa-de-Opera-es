import { processNexusCycle } from '../lib/nexus-engine';
import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    console.log('--- FINAL REAL-TIME VERIFICATION ---');
    
    // Clear last summary to force a REAL ONE with the NEW LOGIC
    await prisma.nexusConfig.deleteMany({
        where: { key: { in: ['NEXUS_LAST_SUMMARY_HOUR', 'NEXUS_LAST_SUMMARY_DAY'] } }
    });

    console.log('Running engine cycle (this will update statuses and send the summary)...');
    await processNexusCycle();
    
    // Check results
    const counts = await prisma.alertCycle.count({
        where: { status: 'EM_ALERTA', date: new Date(format(new Date(new Date().getTime() - 3 * 60 * 60 * 1000), 'yyyy-MM-dd') + 'T00:00:00Z') }
    });
    console.log('Final Exception Count in DB:', counts);
    console.log('Cycle finished. The WhatsApp group should have received a summary with the correct HOUR (9:00 or 10:00) and the names matching the LIVE dashboard.');
}
run();
