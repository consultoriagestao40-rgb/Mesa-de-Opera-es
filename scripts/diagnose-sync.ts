import prisma from '../lib/prisma';
import { getPunches, getAfastamentos, getEmployees } from '../lib/secullum-service';
import { startOfDay, endOfDay, format } from 'date-fns';

async function diagnose() {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');

    console.log('--- DIAGNÓSTICO DE SINCRONIZAÇÃO NEXUS vs SECULLUM ---');
    
    // 1. Raw Secullum Data
    const [punches, afastamentos, employees] = await Promise.all([
        getPunches(todayStr, todayStr),
        getAfastamentos(todayStr, todayStr),
        getEmployees()
    ]);

    console.log(`\n[Secullum Raw]`);
    console.log(`- Punches Today: ${punches.length}`);
    console.log(`- Afastamentos Today: ${afastamentos.length}`);
    console.log(`- Total Employees: ${employees.length}`);

    // 2. Unique people working according to punches
    const uniqueWorkingIds = new Set();
    punches.forEach((p: any) => {
        const id = (p.FuncionarioId || p.funcionarioId || '').toString();
        if (id) uniqueWorkingIds.add(id);
    });
    console.log(`- Unique People with Punches: ${uniqueWorkingIds.size}`);

    // 3. Mapping check for Afastamentos
    const activeCollabs = await prisma.collaborator.findMany({ where: { active: true } });
    console.log(`\n[Nexus DB] Active Collaborators: ${activeCollabs.length}`);

    const mappedAfastamentos = activeCollabs.filter(collab => {
        return afastamentos.some((a: any) => {
            const aPis = (a.NumeroPis || a.numeroPis || '').toString();
            const aCpf = (a.Cpf || a.cpf || '').toString();
            return (aPis && aPis === collab.pis) || (aCpf && aCpf === collab.pis);
        });
    });
    console.log(`- Mapped Afastamentos in Nexus: ${mappedAfastamentos.length}`);

    // 4. Sample check of an afastamento keys
    if (afastamentos.length > 0) {
        console.log(`\n[Debug] First Afastamento Item:`, JSON.stringify(afastamentos[0], null, 2));
    }
}

diagnose().catch(console.error);
