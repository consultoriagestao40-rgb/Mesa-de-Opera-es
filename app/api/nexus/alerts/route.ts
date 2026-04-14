import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        
        const now = new Date();
        // Base date for filtering
        let targetDate = new Date(now.getTime() - 3 * 60 * 60 * 1000); // Default to Brazil Today
        
        if (dateParam) {
            targetDate = new Date(dateParam + 'T12:00:00'); // Use mid-day to avoid TZ shifts
        }

        const activeCycles = await prisma.alertCycle.findMany({
            where: {
                status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'] }, // Focus ONLY on what needs action or expired
                date: {
                    gte: startOfDay(targetDate),
                    lte: endOfDay(targetDate)
                }
            },
            include: {
                collaborator: true
            },
            orderBy: {
                expected_time: 'desc'
            }
        });

        const collaborators = await prisma.collaborator.findMany({ where: { active: true } });
        const allActiveCount = collaborators.length;

        const stats = {
            totalActive: allActiveCount,
            trabalhando: collaborators.filter(c => c.status === 'TRABALHANDO').length,
            faltantes: collaborators.filter(c => c.status === 'FALTANTE').length,
            folga: collaborators.filter(c => c.status === 'FOLGA').length,
            ferias: collaborators.filter(c => c.status === 'FERIAS').length,
            afastados: collaborators.filter(c => c.status === 'AFASTADO').length,
            justificadas: collaborators.filter(c => c.status === 'JUSTIFICADO').length,
            naEscala: collaborators.filter(c => c.status === 'NA_ESCALA').length,
            punches: await prisma.alertCycle.count({
                where: {
                    status: 'CONCLUIDO',
                    date: { gte: startOfDay(targetDate), lte: endOfDay(targetDate) }
                }
            }),
            exceptions: activeCycles.length,
            solicitacoes: 0,
            assinaturas: 0
        };

        return NextResponse.json({ 
            cycles: activeCycles,
            stats
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
