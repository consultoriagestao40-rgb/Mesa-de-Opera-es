import prisma from '../lib/prisma';
import { getPunches } from '../lib/secullum-service';
import { format } from 'date-fns';

async function investigate() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const punches = await getPunches(today, today);
    const activeCollabs = await prisma.collaborator.findMany({ where: { active: true } });

    console.log('Nexus Active:', activeCollabs.length);
    console.log('Total Punches:', punches.size); // wait punches is array
    console.log('Total Punches Array Length:', punches.length);

    const workingInNexus = activeCollabs.filter(collab => {
        return punches.some((p: any) => 
            p.FuncionarioId?.toString() === collab.secullumId || 
            p.funcionarioId?.toString() === collab.secullumId
        );
    });

    console.log('Nexus Working (Match by ID):', workingInNexus.length);
    if (workingInNexus.length > 71) {
        console.log('WARNING: Nexus detects more working people than Secullum Dashboard.');
        console.log('Example of extra person:', workingInNexus.find(c => !c.name.includes('...') )); // just some sample
    }
}
investigate();
