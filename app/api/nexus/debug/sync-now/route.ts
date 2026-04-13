import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { processNexusCycle } from '@/lib/nexus-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[SYNC] Iniciando sincronismo de emergência...');

        // 1. Garantir que as credenciais estão no banco
        const configs = [
            { key: 'SECULLUM_USERNAME', value: 'cristiano@grupojvsserv.com.br' },
            { key: 'SECULLUM_PASSWORD', value: '8Gmw.@DzuuHEz9' },
            { key: 'SECULLUM_DATABASE_ID', value: '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c' },
            { key: 'SECULLUM_CLIENT_ID', value: '3' },
            { key: 'NEXUS_SYSTEM_ACTIVE', value: 'true' }
        ];

        const { setNexusConfig } = require('@/lib/config-service');
        for (const config of configs) {
            await setNexusConfig(config.key, config.value);
        }

        // 2. Disparar o Sincronismo usando o processo completo
        const result = await processNexusCycle();

        // 3. Verificar o resultado no banco
        const count = await prisma.collaborator.count();

        return NextResponse.json({
            success: true,
            message: 'Sincronismo concluído via ProcessNexusCycle!',
            collaborators_in_db: count,
            details: result
        });

    } catch (error: any) {
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            details: error.response?.data || 'Sem detalhes adicionais'
        }, { status: 500 });
    }
}
