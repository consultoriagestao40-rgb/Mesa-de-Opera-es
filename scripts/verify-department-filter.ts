import prisma from '../lib/prisma';
import { getPunches, getAfastamentos } from '../lib/secullum-service';
import { format } from 'date-fns';

async function verify() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [punches, afastamentos, activeCollabs] = await Promise.all([
        getPunches(today, today),
        getAfastamentos(today, today),
        prisma.collaborator.findMany({ 
            where: { 
                active: true,
                departamento: 'EMPRESA DE ONIBUS PENHA' 
            } 
        })
    ]);

    console.log('--- VERIFICAÇÃO POR DEPARTAMENTO (PENHA) ---');
    console.log('Total Colaboradores Ativos no Dept PENHA:', activeCollabs.length);

    const punchMap = new Map();
    punches.forEach((p: any) => {
        const id = (p.FuncionarioId || p.funcionarioId || '').toString();
        if (!punchMap.has(id)) punchMap.set(id, []);
        punchMap.get(id).push(p);
    });

    let countWorking = 0;
    let countTotal = activeCollabs.length;

    activeCollabs.forEach(collab => {
        const pList = punchMap.get(collab.secullumId) || [];
        const realPunches = pList.filter((p: any) => /^\d{2}:\d{2}$/.test(p.Entrada1 || ''));
        if (realPunches.length > 0 && realPunches.length % 2 !== 0) {
            countWorking++;
        }
    });

    console.log('Trabalhando no Dept PENHA:', countWorking);
}
verify();
