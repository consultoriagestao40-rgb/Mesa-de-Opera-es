import { getPunches } from '../lib/secullum-service';
import { format } from 'date-fns';

async function test() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const punches = await getPunches(today, today);
    const punchCountMap = new Map();
    
    punches.forEach((p: any) => {
        const id = (p.FuncionarioId || p.funcionarioId || '').toString();
        punchCountMap.set(id, (punchCountMap.get(id) || 0) + 1);
    });

    let oddPunches = 0;
    for (let count of punchCountMap.values()) {
        if (count % 2 !== 0) oddPunches++;
    }

    console.log('Total People with punches:', punchCountMap.size);
    console.log('People with ODD number of punches (entered but not exited):', oddPunches);
}
test();
