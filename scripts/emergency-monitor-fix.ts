import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function run() {
    console.log('--- EMERGENCY MONITOR INVESTIGATION ---');
    const now = new Date();
    // Brazil Time adjust (-3h)
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    
    const collaborators = await prisma.collaborator.findMany({
        where: { active: true, status: 'FALTANTE' }
    });

    console.log('Faltantes count in DB:', collaborators.length);
    for (const c of collaborators) {
        const cycle = await prisma.alertCycle.findFirst({
            where: {
                collaborator_id: c.id,
                date: { gte: startOfDay(brazilNow), lte: endOfDay(brazilNow) }
            }
        });
        console.log(`- ${c.name}: Status=${c.status} | Has Cycle? ${cycle ? 'YES ('+cycle.status+')' : 'NO'}`);
        
        if (!cycle) {
            console.log(`  > EMERGENCY: Creating missing cycle for ${c.name}`);
            await prisma.alertCycle.create({
                data: {
                    collaborator_id: c.id,
                    date: startOfDay(brazilNow),
                    expected_time: now, // use current time for emergency visibility
                    event_type: 'ENTRADA',
                    status: 'EM_ALERTA',
                    current_step: 1
                }
            });
        } else if (cycle.status === 'PENDENTE' || cycle.status === 'CONCLUIDO') {
             console.log(`  > EMERGENCY: Updating cycle status to EM_ALERTA for ${c.name}`);
             await prisma.alertCycle.update({
                 where: { id: cycle.id },
                 data: { status: 'EM_ALERTA' }
             });
        }
    }
}
run();
