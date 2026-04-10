const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function debug() {
  console.log('--- DIAGNÓSTICO NEXUS -> SECULLUM ---');
  
  try {
    const configs = await prisma.nexusConfig.findMany();
    const configMap = configs.reduce((acc, c) => ({ ...acc, [c.key]: c.value }), {});
    
    const username = configMap['SECULLUM_USERNAME'];
    const password = configMap['SECULLUM_PASSWORD'];
    const dbId = configMap['SECULLUM_DATABASE_ID'];

    console.log('Dados no Banco:');
    console.log('- Usuário:', username);
    console.log('- Senha:', password ? '********' : 'VAZIA');
    console.log('- DB ID:', dbId);

    if (!username || !password) {
      console.error('❌ Faltam credenciais no banco!');
      return;
    }

    const clientIds = ['1', '3', 'pontoweb'];
    let workingToken = null;

    for (const cid of clientIds) {
      console.log(`\nTestando Client ID: ${cid}...`);
      const params = new URLSearchParams();
      params.append('grant_type', 'password');
      params.append('username', username);
      params.append('password', password);
      params.append('client_id', cid);

      try {
        const authResp = await axios.post('https://autenticador.secullum.com.br/Token', params.toString(), {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log(`✅ SUCESSO com CID ${cid}!`);
        workingToken = authResp.data.access_token;
        break; 
      } catch (err) {
        console.log(`❌ FALHA com CID ${cid}:`, err.response ? err.response.data : err.message);
      }
    }

    if (workingToken) {
      console.log('\n--- LISTANDO BANCOS DE DADOS ---');
      try {
        const dbList = await axios.get('https://autenticador.secullum.com.br/ContasSecullumExterno/ListarBancos/', {
          headers: { 'Authorization': `Bearer ${workingToken}` }
        });
        console.log('Bancos Vinculados:');
        console.log(JSON.stringify(dbList.data, null, 2));
        
        const exists = dbList.data.some(d => d.DBSecullumID === dbId);
        console.log(`\nO ID ${dbId} está na lista? ${exists ? 'SIM ✅' : 'NÃO ❌'}`);
      } catch (err) {
        console.error('Erro ao listar bancos:', err.message);
      }
    }

  } catch (e) {
    console.error('Erro Geral:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

debug();
