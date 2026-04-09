import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const history = await prisma.alertCycle.findMany({
            include: {
                collaborator: true
            },
            orderBy: {
                created_at: 'desc'
            },
            take: 100 // Limit for now
        });

        return NextResponse.json({ history });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
