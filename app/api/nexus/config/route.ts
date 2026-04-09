import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * API for managing Nexus Operacional configurations (Z-API, Secullum, etc.)
 */
export async function GET() {
    try {
        const configs = await prisma.nexusConfig.findMany();
        return NextResponse.json({ configs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { key, value, description } = await request.json();

        if (!key || value === undefined) {
            return NextResponse.json({ error: 'Key and Value are required' }, { status: 400 });
        }

        const config = await prisma.nexusConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description }
        });

        return NextResponse.json({ success: true, config });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
