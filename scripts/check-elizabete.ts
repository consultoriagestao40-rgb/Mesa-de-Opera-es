import prisma from '../lib/prisma';
async function run() {
    const cycles = await prisma.alertCycle.findMany({
        where: { collaborator: { name: { contains: 'ELIZABETE BRUM ANTONIO' } } },
        orderBy: { expected_time: 'asc' }
    });
    console.log('ELIZABETE CYCLES:');
    cycles.forEach(c => {
         const brtTime = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(c.expected_time);
         console.log(`- Expected: ${brtTime} | Status: ${c.status}`);
    });
}
run();
