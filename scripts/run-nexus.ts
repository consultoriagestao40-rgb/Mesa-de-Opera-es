import { processNexusCycle } from '../lib/nexus-engine';
import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function main() {
    console.log('--- EXECUTANDO CICLO NEXUS MANUALMENTE ---');
    try {
        await processNexusCycle();
        
        const now = new Date();
        const start = startOfDay(now);
        const end = endOfDay(now);
        
        const confirmed = await prisma.alertCycle.count({
            where: {
                date: { gte: start, lte: end },
                status: 'CONCLUIDO'
            }
        });
        
        console.log(`\n✅ SALDO FINAL DE PRESENÇAS CONFIRMADAS NO BANCO: ${confirmed}`);
    } catch (e) {
        console.error('Erro:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
