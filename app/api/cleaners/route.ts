import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { getUserFromToken } from '@/lib/auth';

export async function GET(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await getUserFromToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const collaborators = await prisma.collaborator.findMany({
            where: { active: true },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ cleaners: collaborators }); // Keep key for frontend compat temporarily

    } catch (error) {
        console.error('List Cleaners Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await getUserFromToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role === 'CLIENT') {
            return NextResponse.json({ error: 'Acesso negado: Seu perfil possui apenas permissão de visualização. Contate um administrador para maiores permissões.' }, { status: 403 });
        }

        const { name, pis, secullumId, posto } = await request.json();

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const collaborator = await prisma.collaborator.create({
            data: { 
                name,
                pis: pis || null,
                secullumId: secullumId || null,
                posto: posto || null
            }
        });

        return NextResponse.json({ cleaner: collaborator });

    } catch (error) {
        console.error('Create Cleaner Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await getUserFromToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role === 'CLIENT') {
            return NextResponse.json({ error: 'Acesso negado: Seu perfil possui apenas permissão de visualização. Contate um administrador para maiores permissões.' }, { status: 403 });
        }

        const { id, name, active, pis, secullumId, posto } = await request.json();

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const collaborator = await prisma.collaborator.update({
            where: { id },
            data: {
                name,
                active,
                pis: pis !== undefined ? (pis || null) : undefined,
                secullumId: secullumId !== undefined ? (secullumId || null) : undefined,
                posto: posto !== undefined ? (posto || null) : undefined
            }
        });

        return NextResponse.json({ cleaner: collaborator });

    } catch (error) {
        console.error('Update Cleaner Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token')?.value;
        const user = token ? await getUserFromToken(token) : null;

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (user.role === 'CLIENT') {
            return NextResponse.json({ error: 'Acesso negado: Seu perfil possui apenas permissão de visualização. Contate um administrador para maiores permissões.' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        // Check if has cycles
        const historyCount = await prisma.alertCycle.count({
            where: { collaborator_id: id }
        });

        if (historyCount > 0) {
            // Soft delete (deactivate) if has history
            await prisma.collaborator.update({
                where: { id },
                data: { active: false }
            });
            return NextResponse.json({ message: 'Collaborator deactivated due to existing history' });
        } else {
            // Hard delete if no history
            await prisma.collaborator.delete({
                where: { id }
            });
            return NextResponse.json({ message: 'Collaborator deleted' });
        }

    } catch (error) {
        console.error('Delete Cleaner Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
