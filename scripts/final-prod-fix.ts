import prisma from '../lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

async function run() {
    console.log('--- FINAL PRODUCTION SYNC & FIX ---');
    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    const today = startOfDay(brazilNow);

    // 1. Check for Faltantes in Collaborator table
    const faltantes = await prisma.collaborator.findMany({
        where: { active: true, status: 'FALTANTE' }
    });
    console.log('Faltantes identified in DB:', faltantes.length);

    for (const collab of faltantes) {
        // Find existing cycle for today
        const cycle = await prisma.alertCycle.findFirst({
            where: {
                collaborator_id: collab.id,
                date: { gte: today, lte: endOfDay(today) }
            }
        });

        if (!cycle) {
            console.log(`Creating missing AlertCycle for ${collab.name}`);
            await prisma.alertCycle.create({
                data: {
                    collaborator_id: collab.id,
                    date: today,
                    expected_time: now,
                    event_type: 'ENTRADA',
                    status: 'EM_ALERTA',
                    current_step: 1
                }
            });
        } else if (cycle.status === 'PENDENTE') {
            console.log(`Upgrading PENDENTE cycle for ${collab.name} to EM_ALERTA`);
            await prisma.alertCycle.update({
                where: { id: cycle.id },
                data: { status: 'EM_ALERTA' }
            });
        }
    }

    // 2. Clear any cache/metadata if needed? No, just ensure the data exists.
    const allActiveInTable = await prisma.alertCycle.count({
        where: { status: { in: ['EM_ALERTA', 'PENDENTE', 'ENCERRADO'] }, date: { gte: today } }
    });
    console.log('Total visible cycles in DB now:', allActiveInTable);
}
run();
