import prisma from '../lib/prisma';

async function run() {
    console.log('--- INSPECTING 143 CYCLES ---');
    const cycles = await prisma.alertCycle.findMany({
        where: { status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'] } },
        include: { collaborator: true },
        take: 200
    });
    
    console.log('Total found:', cycles.length);
    
    // Group by date
    const groups = cycles.reduce((acc: any, c) => {
        const d = c.date.toISOString();
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {});
    
    console.log('Count by Date:', groups);
    
    // Sample a few
    cycles.slice(0, 10).forEach(c => {
        console.log(`[${c.id}] Date: ${c.date.toISOString()} | Expected: ${c.expected_time.toISOString()} | Collab: ${c.collaborator?.name} | Event: ${c.event_type} | Status: ${c.status}`);
    });
}
run();
