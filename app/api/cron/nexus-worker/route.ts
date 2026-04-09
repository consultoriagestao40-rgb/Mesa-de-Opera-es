import { NextRequest, NextResponse } from 'next/server';
import { processNexusCycle } from '@/lib/nexus-engine';

/**
 * Nexus Worker (Cron)
 * 
 * Runs the monitoring cycle for the Nexus Operacional.
 * Frequency: Every 2-5 minutes via Vercel Cron.
 */
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        await processNexusCycle();
        return NextResponse.json({ success: true, timestamp: new Date().toISOString() });
    } catch (error: any) {
        console.error('[Nexus Worker] Error:', error.message);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
