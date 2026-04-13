import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import axios from 'axios';
import { processNexusCycle } from '@/lib/nexus-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        console.log('[SYNC] Iniciando sincronismo de emergência...');

        console.log('[SYNC] Iniciando sincronismo de emergência via processo completo');

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
