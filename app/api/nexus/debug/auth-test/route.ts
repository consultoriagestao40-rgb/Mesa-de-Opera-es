import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const secullumService = require('@/lib/secullum-service');
        const token = await secullumService.default?.getAccessToken?.() || await secullumService.getAccessToken?.();
        
        return NextResponse.json({
            success: true,
            message: 'Token retrieved',
            token: token ? (token.substring(0, 10) + '...') : null
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message,
            stack: e.stack
        }, { status: 500 });
    }
}
