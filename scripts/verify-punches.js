const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();
const { format } = require('date-fns');

async function main() {
    console.log('--- 🧪 TESTE DE SINCRONISMO: BATIDAS ---');
    
    try {
        const configs = await prisma.nexusConfig.findMany();
        const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
        
        const username = configMap['SECULLUM_USERNAME'];
        const password = configMap['SECULLUM_PASSWORD'];
        const databaseId = configMap['SECULLUM_DATABASE_ID'];

        if (!username || !password || !databaseId) {
            console.error('❌ Falta configuração!');
            return;
        }

        // 1. Auth
        console.log('1. Autenticando...');
        const params = new URLSearchParams();
        params.append('grant_type', 'password');
        params.append('username', username);
        params.append('password', password);
        params.append('client_id', '3');

        const authRes = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        const token = authRes.data.access_token;
        console.log('✅ Autenticado.');

        // 2. Fetch Punches
        const today = format(new Date(), 'yyyy-MM-dd');
        console.log(`2. Buscando batidas de hoje (${today})...`);
        
        const url = 'https://pontowebintegracaoexterna.secullum.com.br/IntegracaoExterna/Batidas';
        const res = await axios.get(url, {
            params: { DataInicio: today, DataFim: today, SomenteLog: true },
            headers: {
                'Authorization': `Bearer ${token}`,
                'secullumidbancoselecionado': databaseId
            }
        });

        const punches = res.data || [];
        console.log(`✅ Recebidas ${punches.length} batidas.`);
        
        const validPunch = punches.find(p => p.Entrada1 && p.Entrada1.includes(':'));

        if (validPunch) {
            console.log('✅ Batida VÁLIDA encontrada:');
            console.log(JSON.stringify(validPunch, null, 2));
        } else {
            console.log('⚠️ Nenhuma batida com horário (HH:mm) encontrada para hoje.');
            if (punches.length > 0) {
                console.log('Amostra da primeira batida recebida:', JSON.stringify(punches[0], null, 2));
            }
        }

        // 3. Fetch Collaborators to see IDs
        console.log('\n3. Verificando Collaborators no Banco Local...');
        const internalCollabs = await prisma.collaborator.findMany({ take: 5 });
        console.log('Amostra de Collaborators locais:', internalCollabs.map(c => ({ name: c.name, secullumId: c.secullumId })));

    } catch (e) {
        console.error('❌ Erro:', e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
