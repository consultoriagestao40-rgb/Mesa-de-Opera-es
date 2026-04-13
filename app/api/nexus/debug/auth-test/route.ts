import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const { getEmployees } = require('@/lib/secullum-service');
        const employees = await getEmployees();
        
        return NextResponse.json({
            success: true,
            total: employees.length,
            sample: employees.slice(0, 5) // Return first 5 to analyze schema
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}
