import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { processNexusCycle } from '@/lib/nexus-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[DEBUG] Iniciando Setup de Produção...');

        // 1. Injetar Configurações no Banco da Vercel
        const configs = [
            { key: 'SECULLUM_USERNAME', value: 'cristiano@grupojvsserv.com.br' },
            { key: 'SECULLUM_PASSWORD', value: '8Gmw.@DzuuHEz9' },
            { key: 'SECULLUM_DATABASE_ID', value: '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c' },
            { key: 'SECULLUM_CLIENT_ID', value: '3' },
            { key: 'NEXUS_SYSTEM_ACTIVE', value: 'true' }
        ];

        for (const config of configs) {
            await prisma.nexusConfig.upsert({
                where: { key: config.key },
                update: { value: config.value },
                create: { key: config.key, value: config.value }
            });
        }

        console.log('[DEBUG] Configurações Injetadas. Disparando Sincronismo...');

        // 2. Disparar Sincronismo
        const syncResult = await processNexusCycle();

        // 3. Verificar Contagem Final
        const count = await prisma.collaborator.count();

        return NextResponse.json({
            success: true,
            message: 'Setup e Sincronismo concluídos com sucesso!',
            total_collaborators: count,
            sync_details: syncResult
        });

    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
