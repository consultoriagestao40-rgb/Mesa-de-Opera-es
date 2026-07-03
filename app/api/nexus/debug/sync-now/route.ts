import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { processNexusCycle } from '@/lib/nexus-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[SYNC] Iniciando sincronismo de emergência...');

        console.log('[SYNC] Iniciando sincronismo de emergência via processo completo');
        const configs = [
            { key: 'SECULLUM_USERNAME', value: 'cristiano@grupojvsserv.com.br' },
            { key: 'SECULLUM_PASSWORD', value: '8Gmw.@DzuuHEz9' },
            { key: 'SECULLUM_DATABASE_ID', value: '85740' },
            { key: 'SECULLUM_CLIENT_ID', value: '3' },
            { key: 'NEXUS_SYSTEM_ACTIVE', value: 'true' }
        ];

        const { setNexusConfig } = require('@/lib/config-service');
        for (const config of configs) {
            await setNexusConfig(config.key, config.value);
        }

        // 1.5. Limpar SentPunch de hoje para forçar o reenvio e reconstruir com os horários corretos
        const now = new Date();
        const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const todayStr = brazilNow.toISOString().split("T")[0]; // "2026-07-03"
        const normalizedToday = new Date(todayStr + "T00:00:00Z");
        await prisma.sentPunch.deleteMany({
            where: {
                date: normalizedToday
            }
        });

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
        const { getNexusConfigs } = require('@/lib/config-service');
        const configs = await getNexusConfigs();
        return NextResponse.json({ 
            success: false, 
            error: error.message,
            read_user: configs['SECULLUM_USERNAME'],
            read_pass: configs['SECULLUM_PASSWORD'],
            details: error.response?.data || 'Sem detalhes adicionais'
        }, { status: 500 });
    }
}
