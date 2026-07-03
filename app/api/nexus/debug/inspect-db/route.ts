import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getPunches } from '@/lib/secullum-service';
import { format } from 'date-fns';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const now = new Date();
        const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const todayStr = format(brazilNow, 'yyyy-MM-dd');

        // Buscar colaboradores com nome parecido com "ADRIANA"
        const collaborators = await prisma.collaborator.findMany({
            where: {
                name: { contains: 'ADRIANA', mode: 'insensitive' }
            }
        });

        // Buscar batidas diretas do Secullum hoje
        const todayPunches = await getPunches(todayStr, todayStr);

        // Buscar as últimas 20 batidas enviadas (SentPunch)
        const sentPunches = await prisma.sentPunch.findMany({
            take: 20,
            orderBy: { sent_at: 'desc' },
            include: { collaborator: true }
        });

        return NextResponse.json({
            success: true,
            todayStr,
            collaboratorsMatched: collaborators,
            punchesInSecullumCount: todayPunches.length,
            punchesInSecullum: todayPunches,
            sentPunchesCount: sentPunches.length,
            sentPunches
        });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
