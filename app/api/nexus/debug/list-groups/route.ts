import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const configs = await prisma.nexusConfig.findMany();
        const instanceId = configs.find(c => c.key === 'ZAPI_INSTANCE_ID')?.value?.trim();
        const token = configs.find(c => c.key === 'ZAPI_TOKEN')?.value?.trim();
        const clientToken = configs.find(c => c.key === 'ZAPI_CLIENT_TOKEN')?.value?.trim();

        if (!instanceId || !token) {
            return NextResponse.json({ error: 'ZAPI_INSTANCE_ID e ZAPI_TOKEN não configurados.' }, { status: 400 });
        }

        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
        const res = await axios.get(url, {
            headers: clientToken ? { 'Client-Token': clientToken } : {}
        });

        const allChats = res.data || [];
        const groups = allChats.filter((c: any) => 
            c.isGroup || 
            c.phone?.includes('@g.us') || 
            c.id?.includes('@g.us')
        );

        return NextResponse.json({
            total: groups.length,
            groups: groups.map((g: any) => ({
                id: g.phone || g.id,
                name: g.name || g.subject || 'Grupo sem nome'
            }))
        });
    } catch (e: any) {
        return NextResponse.json({
            error: e.response?.data || e.message,
            hint: 'Verifique se ZAPI_CLIENT_TOKEN está configurado em Configurações'
        }, { status: 500 });
    }
}
