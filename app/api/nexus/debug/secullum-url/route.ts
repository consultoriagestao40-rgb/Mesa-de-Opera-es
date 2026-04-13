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
        
        const dbList = await axios.get('https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        return NextResponse.json({
            success: true,
            auth: 'ok',
            databases: dbList.data
        });
    } catch (e: any) {
        return NextResponse.json({
            success: false,
            error: e.message,
            details: e.response?.data
        }, { status: 500 });
    }
}
