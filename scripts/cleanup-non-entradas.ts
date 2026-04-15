import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    console.log('--- CLEANING UP NON-ENTRADA CYCLES ---');
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');

    const deleted = await prisma.alertCycle.deleteMany({
        where: {
            date: normalizedToday,
            event_type: { not: 'ENTRADA' }
        }
    });
    
    console.log(`Deleted ${deleted.count} non-ENTRADA cycles for today (${todayStr}).`);
}
run();
