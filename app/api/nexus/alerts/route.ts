import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { startOfDay, endOfDay, format } from 'date-fns';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const dateParam = searchParams.get('date');
        
        const now = new Date();
        // Determine "Today" in Brazil (UTC-3)
        const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const todayStr = format(brazilNow, 'yyyy-MM-dd');
        
        // Target date from param or default to today
        const targetDateStr = dateParam || todayStr;
        const normalizedTargetDate = new Date(targetDateStr + 'T00:00:00Z');
        
        const activeCycles = await prisma.alertCycle.findMany({
            where: {
                status: { in: ['PENDENTE', 'EM_ALERTA', 'ENCERRADO'] },
                date: normalizedTargetDate
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
                    date: normalizedTargetDate
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
