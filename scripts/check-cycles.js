const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { startOfDay, endOfDay } = require('date-fns');

async function main() {
    console.log('--- 🛡️ DIAGNÓSTICO DE CICLOS DE ALERTA ---');
    
    const now = new Date();
    const start = startOfDay(now);
    const end = endOfDay(now);
    
    console.log(`Buscando ciclos entre ${start.toISOString()} e ${end.toISOString()}`);
    
    const cycles = await prisma.alertCycle.findMany({
        where: {
            date: { gte: start, lte: end }
        },
        include: {
            collaborator: true
        }
    });
    
    console.log(`Encontrados ${cycles.length} ciclos para hoje.`);
    
    if (cycles.length > 0) {
        console.log('Amostra de ciclos:');
        cycles.slice(0, 5).forEach(c => {
            console.log(`- ${c.collaborator.name} | ${c.event_type} | Previsto: ${c.expected_time.toISOString()} | Status: ${c.status}`);
        });
    }

    const confirmed = await prisma.alertCycle.count({
        where: {
            date: { gte: start, lte: end },
            status: 'CONCLUIDO'
        }
    });
    console.log(`\nConfirmados no banco: ${confirmed}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
