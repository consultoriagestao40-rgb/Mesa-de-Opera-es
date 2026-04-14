import prisma from '../lib/prisma';
async function run() {
    const cycles = await prisma.alertCycle.findMany({
        where: { collaborator: { name: { contains: 'JAYSSON' } } },
        orderBy: { id: 'desc' },
        take: 5
    });
    cycles.forEach(c => {
        console.log(`ID: ${c.id} | Date: ${c.date.toISOString()} | Expected: ${c.expected_time.toISOString()}`);
    });
}
run();
