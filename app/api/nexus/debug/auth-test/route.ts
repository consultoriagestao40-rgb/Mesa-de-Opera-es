import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const username = 'cristiano@grupojvsserv.com.br';
        const password = '8Gmw.@DzuuHEz9';
        
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);
        params.append('client_id', '3'); 

        const authResp = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const token = authResp.data.access_token;

        let resultInt = 'PENDING';
        let resultGuid = 'PENDING';

        try {
            const res = await axios.get('https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Funcionarios', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'secullumidbancoselecionado': '85740'
                }
            });
            resultInt = `SUCCESS: ${res.data.length}`;
        } catch (e: any) {
            resultInt = `FAIL INT: ${e.response?.data?.details || e.message}`;
        }

        try {
            const res2 = await axios.get('https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Funcionarios', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'secullumidbancoselecionado': '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c'
                }
            });
            resultGuid = `SUCCESS: ${res2.data.length}`;
        } catch (e: any) {
            resultGuid = `FAIL GUID: ${e.response?.data?.details || e.message}`;
        }

        return NextResponse.json({
            success: true,
            resultInt,
            resultGuid
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message
        }, { status: 500 });
    }
}
