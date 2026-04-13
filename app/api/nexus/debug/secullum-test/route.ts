import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const username = 'cristiano@grupojvsserv.com.br';
        const password = '8Gmw.@DzuuHEz9';
        const dbId = '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c';
        
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);
        params.append('client_id', '3'); 

        const authResp = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        const token = authResp.data.access_token;
        const results: any = {};
        
        const urlsToTest = [
            'https://pontowebintegracaoexterna.secullum.com.br/api/IntegracaoExterna',
            'https://pontowebintegracaoexterna.secullum.com.br',
            'https://pontowebintegracaoexterna.secullum.com.br/api',
            'https://servicos.secullum.com.br/api/IntegracaoExterna'
        ];

        for (const baseUrl of urlsToTest) {
            try {
                const reqUrl = `${baseUrl}/Funcionarios`;
                const res = await axios.get(reqUrl, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'DBSecullumID': dbId
                    }
                });
                results[baseUrl] = `SUCCESS: ${res.data.length} employees`;
            } catch (e: any) {
                results[baseUrl] = `FAILED: ${e.response?.status} - ${e.message}`;
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
