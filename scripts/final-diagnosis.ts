import prisma from '../lib/prisma';
import { getPunches } from '../lib/secullum-service';
import { format } from 'date-fns';

async function diagnose() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const punches = await getPunches(today, today);
    const activeCollabs = await prisma.collaborator.findMany({ where: { active: true } });

    const faltantesNames = ['ERIT OSCAR COLINA BORGES', 'JOSIANE CRISTINA GRUBERT MAFRA', 'PAULO SERGIO DA SILVA FRAGA', 'YAIMARA DUVERGER MORALES'];
    const folgaNames = ['ADRIAN PENA RAMIREZ', 'GENESIS GABRIELA MARTINEZ GONZALEZ', 'SANDRA PEREIRA MOREIRA'];

    console.log('--- DIAGNÓSTICO FINAL DE FIDELIDADE ---');

    const punchMap = new Map();
    punches.forEach((p: any) => {
        const id = (p.FuncionarioId || p.funcionarioId || '').toString();
        if (!punchMap.has(id)) punchMap.set(id, []);
        punchMap.get(id).push(p);
    });

    console.log('\n[FALTANTES NO SECULLUM]');
    for (const name of faltantesNames) {
        const collab = activeCollabs.find(c => c.name.includes(name));
        if (collab) {
            const pList = punchMap.get(collab.secullumId) || [];
            console.log(`- ${name}: ${pList.length} batidas. Última: ${pList.length > 0 ? pList[pList.length-1].Hora : 'NENHUMA'}`);
        }
    }

    console.log('\n[FOLGAS NO SECULLUM]');
    for (const name of folgaNames) {
        const collab = activeCollabs.find(c => c.name.includes(name));
        if (collab) {
            const pList = punchMap.get(collab.secullumId) || [];
            console.log(`- ${name}: ${pList.length} batidas. Última: ${pList.length > 0 ? pList[pList.length-1].Hora : 'NENHUMA'}`);
        }
    }
}
diagnose();
