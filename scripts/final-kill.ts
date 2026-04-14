import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function run() {
    const now = new Date();
    // Use a very wide range to see where the data is
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    console.log('--- DB DUMP FOR ALERT CYCLES ---');
    console.log('Searching between:', start.toISOString(), 'and', end.toISOString());
    
    const cycles = await prisma.alertCycle.findMany({
        where: { date: { gte: start, lte: end } },
        include: { collaborator: true }
    });
    
    console.log('Cycles found:', cycles.length);
    cycles.forEach(c => {
        console.log(`- ${c.collaborator.name} | Date: ${c.date.toISOString()} | Expected: ${c.expected_time.toISOString()} | Status: ${c.status}`);
    });
}
run();
