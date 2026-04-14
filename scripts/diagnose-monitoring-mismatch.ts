import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');
    
    console.log('--- DIAGNOSTIC ---');
    console.log('Local Time:', brazilNow.toISOString());
    console.log('Normalized Today:', normalizedToday.toISOString());

    // 1. Get ALL EM_ALERTA cycles for today
    const cycles = await prisma.alertCycle.findMany({
        where: {
            status: 'EM_ALERTA',
            date: normalizedToday
        },
        include: { collaborator: true }
    });
    
    console.log(`Found ${cycles.length} EM_ALERTA cycles for today.`);
    cycles.forEach(c => {
        console.log(`- ${c.collaborator?.name} | Event: ${c.event_type} | Expected: ${c.expected_time.toISOString()}`);
    });

    // 2. Check if there are cycles with OTHER formats of "Today"
    const otherTodayCycles = await prisma.alertCycle.findMany({
        where: {
            status: 'EM_ALERTA',
            date: { not: normalizedToday },
            expected_time: { gte: normalizedToday } // roughly today
        },
        include: { collaborator: true }
    });
    
    if (otherTodayCycles.length > 0) {
        console.log(`Found ${otherTodayCycles.length} EM_ALERTA cycles with non-normalized dates!`);
        otherTodayCycles.forEach(c => {
            console.log(`- ${c.collaborator?.name} | Date: ${c.date.toISOString()}`);
        });
    }
}
run();
