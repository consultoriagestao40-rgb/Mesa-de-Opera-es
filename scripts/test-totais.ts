import { secullumRequest } from './lib/secullum-service';
import { format } from 'date-fns';

async function testTotais() {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('Calling SomenteTotais for:', today);
    try {
        const result = await secullumRequest('Calcular/SomenteTotais', {
            dataInicial: today,
            dataFinal: today
        }, 'POST');
        console.log('RESULTADO TOTAIS:', JSON.stringify(result, null, 2));
    } catch (e) {
        console.error('ERRO AO CHAMAR TOTAIS:', e);
    }
}
testTotais();
