import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    console.log('--- INTEGRITY CHECK (FINAL) ---');
    
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');

    const cycles = await prisma.alertCycle.findMany({
        where: { date: normalizedToday },
        include: { collaborator: true }
    });
    
    console.log(`Found ${cycles.length} cycles for today.`);
    
    // Check JAYSSON and FERNANDO
    const targets = ['JAYSSON DOS SANTOS GUEDES', 'FERNANDO JOSE OSTROSKA', 'ELIZABETE BRUM ANTONIO'];
    cycles.filter(c => targets.includes(c.collaborator?.name || '')).forEach(c => {
         // Adjusting for display (UTC -> BRT display)
         const brtTime = format(new Date(c.expected_time.getTime() - 3 * 60 * 60 * 1000), 'HH:mm');
         console.log(`- ${c.collaborator?.name}: Expected at ${brtTime} | Status: ${c.status}`);
    });
}
run();
