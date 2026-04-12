import { NextResponse } from 'next/server';
import axios from 'axios';
import { getNexusConfigs } from '@/lib/config-service';

export const dynamic = 'force-dynamic';

async function getAuth() {
    const configs = await getNexusConfigs();
    const params = new URLSearchParams({
        grant_type: 'password',
        username: configs['SECULLUM_USERNAME'] || 'cristiano@grupojvsserv.com.br',
        password: configs['SECULLUM_PASSWORD'] || '8Gmw.@DzuuHEz9',
        client_id: '3'
    });
    const res = await axios.post('https://autenticador.secullum.com.br/Token', params.toString());
    return res.data.access_token;
}

export async function GET() {
    try {
        const token = await getAuth();
        const configs = await getNexusConfigs();
        const dbId = configs['SECULLUM_DATABASE_ID'] || '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c';

        // Lista de URLs prováveis da Secullum
        const endpoints = [
            'https://pontoweb.secullum.com.br/api/IntegracaoExterna/Funcionarios',
            'https://pontoweb.secullum.com.br/IntegracaoExterna/api/Funcionarios',
            'https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Funcionarios',
            'https://pontoweb.secullum.com.br/PontoWeb/IntegracaoExterna/api/Funcionarios',
            'https://pontowebintegracaoexterna.secullum.com.br/api/IntegracaoExterna/Funcionarios'
        ];

        const results = [];
        for (const url of endpoints) {
            try {
                // Testar com o cabeçalho oficial DBSecullumID
                const res = await axios.get(url, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'DBSecullumID': dbId
                    },
                    timeout: 5000
                });
                results.push({ url, status: 'SUCCESS', count: res.data?.length });
            } catch (e: any) {
                results.push({ url, status: 'FAILED', error: e.response?.status || e.message });
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Buscador concluído. Veja qual URL retornou SUCCESS.',
            results 
        });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
