import { processNexusCycle } from '../lib/nexus-engine';
import prisma from '../lib/prisma';

async function run() {
    console.log('--- FORCING HOURLY SUMMARY TEST ---');
    
    // Clear last summary hour to force trigger
    await prisma.nexusConfig.deleteMany({
        where: { key: { in: ['NEXUS_LAST_SUMMARY_HOUR', 'NEXUS_LAST_SUMMARY_DAY'] } }
    });
    
    console.log('Last summary config cleared. Running engine cycle...');
    await processNexusCycle();
    console.log('Cycle finished. Check the WhatsApp group for the summary.');
}
run();
