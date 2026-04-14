import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');

    const faltantes = await prisma.collaborator.findMany({
        where: { active: true, status: 'FALTANTE' },
        select: { name: true }
    });

    const activeCycles = await prisma.alertCycle.findMany({
        where: { status: 'EM_ALERTA', date: normalizedToday },
        include: { collaborator: true }
    });

    console.log('--- COMPARISON ---');
    console.log('Faltantes Count:', faltantes.length);
    console.log('Exceptions Count:', activeCycles.length);

    const fNames = faltantes.map(f => f.name).sort();
    const cNames = Array.from(new Set(activeCycles.map(c => c.collaborator?.name))).sort();

    console.log('\nNames in Faltantes List:');
    fNames.forEach(n => console.log(`- ${n}`));

    console.log('\nNames in Exception Table:');
    cNames.forEach(n => console.log(`- ${n}`));
}
run();
