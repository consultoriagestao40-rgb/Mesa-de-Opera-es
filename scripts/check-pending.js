const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- DIAGNÓSTICO DE PENDÊNCIAS NEXUS ---');
    
    // Pegar o horário atual
    const now = new Date();
    console.log('Horário local (UTC do script):', now.toISOString());

    // Buscar qualquer ciclo com status pendente ou em alerta
    const pending = await prisma.alertCycle.findMany({
        where: {
            status: { in: ['PENDENTE', 'EM_ALERTA'] }
        },
        include: { collaborator: true }
    });

    console.log(`Encontrados ${pending.length} ciclos pendentes/em alerta.`);
    
    if (pending.length > 0) {
        pending.forEach(p => {
            console.log(`- ${p.collaborator.name} | ${p.event_type} | Esperado UTC: ${p.expected_time.toISOString()} | Passo: ${p.current_step}`);
        });
    } else {
        console.log('Não há nenhum alerta pendente neste momento!');
    }
}

main().finally(async () => await prisma.$disconnect());
