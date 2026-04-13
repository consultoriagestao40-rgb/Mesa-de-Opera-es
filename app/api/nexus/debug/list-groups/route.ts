import { NextResponse } from 'next/server';
import axios from 'axios';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const configs = await prisma.nexusConfig.findMany();
        const instanceId = configs.find(c => c.key === 'ZAPI_INSTANCE_ID')?.value?.trim();
        const token = configs.find(c => c.key === 'ZAPI_TOKEN')?.value?.trim();

        if (!instanceId || !token) {
            return NextResponse.json({ error: 'ZAPI_INSTANCE_ID e ZAPI_TOKEN não configurados nas configurações.' }, { status: 400 });
        }

        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
        const res = await axios.get(url);

        // Filter only groups
        const groups = (res.data || []).filter((c: any) => c.isGroup || c.id?.includes('@g.us'));

        return NextResponse.json({
            total_groups: groups.length,
            groups: groups.map((g: any) => ({
                id: g.id,
                name: g.name || g.subject,
                participants: g.participants?.length
            }))
        });
    } catch (e: any) {
        return NextResponse.json({
            error: e.response?.data || e.message
        }, { status: 500 });
    }
}
