import prisma from '../lib/prisma';
import { triggerYesterdayPendingReport } from '../lib/nexus-engine';
import { format } from 'date-fns';

async function main() {
    console.log('--- TESTE: DISPARO DO RESUMO DIÁRIO DO DIA ANTERIOR ---');
    
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');

    console.log(`Data de Hoje (Brasil): ${todayStr}`);
    console.log(`Forçando execução do triggerYesterdayPendingReport com forceSend = true...`);

    try {
        await triggerYesterdayPendingReport(normalizedToday, brazilNow, true);
        console.log('✅ Execução concluída com sucesso.');
    } catch (error: any) {
        console.error('❌ Erro durante o disparo do resumo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
