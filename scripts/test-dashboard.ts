import { getPunches, getAfastamentos, getEmployees, getScheduleByNumber } from '../lib/secullum-service';
import { format } from 'date-fns';

async function test() {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('--- BUSCANDO DADOS BRUTOS SECULLUM PARA MATCHING ---');
    
    // Test the "Totals" logic precisely
    const punches = await getPunches(today, today);
    const afastamentos = await getAfastamentos(today, today);
    const employees = await getEmployees();

    console.log('Punches:', punches.length);
    console.log('Afastamentos:', afastamentos.length);
    
    // Let's see the unique employees in punches
    const uniqueIds = new Set(punches.map((p: any) => p.FuncionarioId?.toString() || p.funcionarioId?.toString()));
    console.log('Unique Working IDs:', uniqueIds.size);
}
test();
