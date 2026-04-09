import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET() {
    try {
        const email = 'admin@mesadeoperacoes.com.br';
        const password = 'admin123';
        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password_hash,
                active: true,
                role: 'ADMIN' as any
            },
            create: {
                email,
                name: 'Administrador Mesa',
                password_hash,
                role: 'ADMIN' as any,
                active: true
            }
        });

        return NextResponse.json({ 
            success: true, 
            message: 'Admin user created/updated successfully!',
            user: { email: user.email, name: user.name }
        });
    } catch (error: any) {
        console.error('Seed error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
