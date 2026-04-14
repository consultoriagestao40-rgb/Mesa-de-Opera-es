import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');
    
    console.log('Normalized Today:', normalizedToday.toISOString());
    
    const count = await prisma.alertCycle.count({
        where: {
            status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'] },
            date: normalizedToday
        }
    });
    
    console.log('Count for exactly this date:', count);
}
run();
