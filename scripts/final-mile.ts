import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function check() {
    const today = new Date();
    const cycles = await prisma.alertCycle.findMany({
        where: {
            date: { gte: startOfDay(today), lte: endOfDay(today) }
        },
        include: { collaborator: true }
    });

    console.log('--- MONITOR DE EXCEÇÕES (DETALHES) ---');
    console.log('Total de ciclos hoje:', cycles.length);
    cycles.forEach(c => {
        console.log(`- ${c.collaborator.name} | Status: ${c.status} | Passo: ${c.step}`);
    });

    const faltantes = await prisma.collaborator.findMany({ where: { status: 'FALTANTE' } });
    console.log('\nColaboradores com status FALTANTE:', faltantes.length);
    faltantes.forEach(f => {
        const hasCycle = cycles.some(c => c.collaborator_id === f.id);
        console.log(`- ${f.name} | Tem Ciclo? ${hasCycle ? 'SIM' : 'NÃO'}`);
    });
}
check();
