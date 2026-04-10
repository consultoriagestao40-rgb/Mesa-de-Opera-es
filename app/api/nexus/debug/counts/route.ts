import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Rota temporária sem proteção para diagnóstico de banco
export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const collaboratorsTotal = await prisma.collaborator.count();
        const collaboratorsActive = await prisma.collaborator.count({ where: { active: true } });
        const configs = await prisma.nexusConfig.count();
        const users = await prisma.user.count();

        return NextResponse.json({
            status: 'connected',
            database_counts: {
                collaborators_total: collaboratorsTotal,
                collaborators_active: collaboratorsActive,
                nexus_configs: configs,
                users: users
            },
            server_time: new Date().toISOString()
        });
    } catch (error: any) {
        return NextResponse.json({ 
            status: 'error', 
            error: error.message 
        }, { status: 500 });
    }
}
