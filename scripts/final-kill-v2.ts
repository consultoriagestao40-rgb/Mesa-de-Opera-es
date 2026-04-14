import prisma from '../lib/prisma';
import { format } from 'date-fns';

async function run() {
    console.log('--- FINAL SYSTEM ALIGNMENT V2 ---');
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
        // Ensure an EM_ALERTA cycle exists for exactly this normalized date
        const cycle = await prisma.alertCycle.upsert({
            where: {
                collaborator_id_date_event_type_expected_time: {
                    collaborator_id: collab.id,
                    date: normalizedToday,
                    event_type: 'ENTRADA',
                    expected_time: (function() {
                        const d = new Date(normalizedToday);
                        d.setUTCHours(11, 0, 0, 0); // 08:00 BRT
                        return d;
                    })()
                }
            },
            update: { status: 'EM_ALERTA' },
            create: {
                collaborator_id: collab.id,
                date: normalizedToday,
                event_type: 'ENTRADA',
                expected_time: (function() {
                    const d = new Date(normalizedToday);
                    d.setUTCHours(11, 0, 0, 0); // 08:00 BRT
                    return d;
                })(),
                status: 'EM_ALERTA',
                current_step: 1
            }
        });
        console.log(`✅ Cycle for ${collab.name}: ${cycle.status}`);
    }

    console.log('--- ALIGNMENT COMPLETE ---');
}
run();
