import axios from 'axios';

/**
 * Script de Descoberta de Database ID - Secullum
 * 
 * Este script usa as credenciais do Cristiano para listar quais bancos
 * de dados estão disponíveis na conta Secullum dele.
 */

const USERNAME = 'cristiano@grupojvsserv.com.br';
const PASSWORD = '8Gmw.@DzuuHEz9';
const AUTH_URL = 'https://autenticador.secullum.com.br/Token';
const LIST_BANCOS_URL = 'https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/';

async function discover() {
    console.log('--- 🛡️ DESCOBERTA NEXUS: SECULLUM 🛡️ ---');
    
    try {
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', USERNAME);
        params.append('password', PASSWORD);
        params.append('client_id', '3');

        console.log('1. Autenticando na Secullum...');
        const authRes = await axios.post(AUTH_URL, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });

        const token = authRes.data.access_token;
        console.log('✅ Autenticado com sucesso!');

        console.log('2. Listando bancos de dados disponíveis...');
        const bancosRes = await axios.get(LIST_BANCOS_URL, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('\n--- 📊 BANCOS ENCONTRADOS ---');
        console.table(bancosRes.data);
        console.log('\n-----------------------------');
        
    } catch (error: any) {
        console.error('❌ ERRO NA DESCOBERTA:');
        console.error(error.response?.data || error.message);
    }
}

discover();
