import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getNexusConfig, setNexusConfig } from '@/lib/config-service';

export interface GroupFilterRules {
    disabledContracts: string[]; // Lista de postos/contratos desabilitados no grupo
    disabledCollaboratorIds: string[]; // IDs de colaboradores desabilitados individualmente
    enabledCollaboratorIds: string[]; // IDs de colaboradores habilitados individualmente
}

const DEFAULT_RULES: GroupFilterRules = {
    disabledContracts: [],
    disabledCollaboratorIds: [],
    enabledCollaboratorIds: []
};

export async function GET() {
    try {
        // 1. Busca todos os colaboradores ativos
        const collaborators = await prisma.collaborator.findMany({
            where: { active: true },
            select: {
                id: true,
                name: true,
                posto: true,
                departamento: true,
                cpf: true,
                secullumId: true
            },
            orderBy: { name: 'asc' }
        });

        // 2. Agrupa os contratos/postos com contagem de funcionários
        const contractMap = new Map<string, number>();
        collaborators.forEach(c => {
            const posto = (c.posto || 'Geral').trim();
            contractMap.set(posto, (contractMap.get(posto) || 0) + 1);
        });

        const contracts = Array.from(contractMap.entries()).map(([name, count]) => ({
            name,
            count
        })).sort((a, b) => a.name.localeCompare(b.name));

        // 3. Obtém regras salvas no banco
        const rawConfig = await getNexusConfig('WHATSAPP_GROUP_RULES');
        let rules: GroupFilterRules = DEFAULT_RULES;

        if (rawConfig) {
            try {
                rules = JSON.parse(rawConfig);
            } catch (e) {
                console.error('[GroupFilter API] Falha ao analisar JSON de regras:', e);
            }
        }

        return NextResponse.json({
            contracts,
            collaborators,
            rules
        });
    } catch (error: any) {
        console.error('[GroupFilter API] Erro no GET:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { disabledContracts = [], disabledCollaboratorIds = [], enabledCollaboratorIds = [] } = body;

        const rulesToSave: GroupFilterRules = {
            disabledContracts: Array.isArray(disabledContracts) ? disabledContracts : [],
            disabledCollaboratorIds: Array.isArray(disabledCollaboratorIds) ? disabledCollaboratorIds : [],
            enabledCollaboratorIds: Array.isArray(enabledCollaboratorIds) ? enabledCollaboratorIds : []
        };

        const success = await setNexusConfig('WHATSAPP_GROUP_RULES', JSON.stringify(rulesToSave));

        if (!success) {
            return NextResponse.json({ error: 'Erro ao persistir configurações no banco' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            rules: rulesToSave
        });
    } catch (error: any) {
        console.error('[GroupFilter API] Erro no POST:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
