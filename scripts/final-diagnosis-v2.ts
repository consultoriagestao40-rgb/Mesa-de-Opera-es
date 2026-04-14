import prisma from '../lib/prisma';
import { getPunches, getAfastamentos, getEmployees, getScheduleByNumber } from '../lib/secullum-service';
import { startOfDay, endOfDay, format } from 'date-fns';

async function finalDiagnose() {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    console.log('--- FINAL MIRROR DIAGNOSIS ---');
    
    const [punches, afastamentos, activeCollabs] = await Promise.all([
        getPunches(todayStr, todayStr),
        getAfastamentos(todayStr, todayStr),
        prisma.collaborator.findMany({ where: { active: true } })
    ]);

    const punchMap = new Map();
    punches.forEach((p: any) => {
        const id = (p.FuncionarioId || p.funcionarioId || '').toString();
        if (!punchMap.has(id)) punchMap.set(id, []);
        punchMap.get(id).push(p);
    });

    let countWorking = 0;
    let countOff = 0;
    let countLeave = 0;
    let countScheduled = 0;

    activeCollabs.forEach(collab => {
        const pList = punchMap.get(collab.secullumId) || [];
        
        // 1. Leave
        const cleanPis = collab.pis?.replace(/\D/g, '') || '';
        const isLeave = afastamentos.some((a: any) => {
            const aPis = (a.NumeroPis || a.numeroPis || '').toString().replace(/\D/g, '');
            const aCpf = (a.Cpf || a.cpf || '').toString().replace(/\D/g, '');
            return (cleanPis && (aPis === cleanPis || aCpf === cleanPis));
        });

        if (isLeave) {
            countLeave++;
        } else if (pList.length > 0 && pList.length % 2 !== 0) {
            countWorking++;
        } else if (pList.length > 0 && pList.length % 2 === 0) {
            countOff++;
        } else {
           countScheduled++; // Probably Na Escala or Faltante
        }
    });

    console.log(`\nResults for 113 active people:`);
    console.log(`- Trabalhando (Odd Punches): ${countWorking}`);
    console.log(`- Em Folga (Even Punches): ${countOff}`);
    console.log(`- Férias/Afastados (Matched): ${countLeave}`);
    console.log(`- Restante (No Punches): ${countScheduled}`);
}

finalDiagnose().catch(console.error);
