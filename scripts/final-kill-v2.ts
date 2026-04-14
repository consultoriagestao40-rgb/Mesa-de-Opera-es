import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    console.log('--- FINAL SYSTEM ALIGNMENT V2 (FIXED) ---');
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const todayStr = format(brazilNow, 'yyyy-MM-dd');
    const normalizedToday = new Date(todayStr + 'T00:00:00Z');
    
    console.log('Normalized Today:', normalizedToday.toISOString());

    // 1. Get all Faltantes
    const faltantes = await prisma.collaborator.findMany({
        where: { active: true, status: 'FALTANTE' }
    });
    console.log('Identified Faltantes:', faltantes.length);

    for (const collab of faltantes) {
        const expectedTime = new Date(normalizedToday);
        expectedTime.setUTCHours(11, 0, 0, 0); // 08:00 BRT

        const cycle = await prisma.alertCycle.findFirst({
            where: {
                collaborator_id: collab.id,
                date: normalizedToday,
                event_type: 'ENTRADA',
                expected_time: expectedTime
            }
        });

        if (cycle) {
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'EM_ALERTA' }
            });
            console.log(`✅ Updated Cycle for ${collab.name}`);
        } else {
            await prisma.alertCycle.create({
                data: {
                    collaborator_id: collab.id,
                    date: normalizedToday,
                    event_type: 'ENTRADA',
                    expected_time: expectedTime,
                    status: 'EM_ALERTA',
                    current_step: 1
                }
            });
            console.log(`✅ Created Cycle for ${collab.name}`);
        }
    }
    console.log('--- ALIGNMENT COMPLETE ---');
}
run().catch(console.error);
