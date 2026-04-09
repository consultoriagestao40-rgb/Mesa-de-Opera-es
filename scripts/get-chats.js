const https = require('https');
const fs = require('fs');
const path = require('path');

// Ler variáveis de ambiente localmente
const envPath = path.join(__dirname, '..', '.env');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch(e) {
  console.log('Arquivo .env não encontrado');
  process.exit(1);
}

let ZAPI_INSTANCE_ID = '';
let ZAPI_TOKEN = '';
let ZAPI_CLIENT_TOKEN = '';

envContent.split('\n').forEach(line => {
  if(line.startsWith('ZAPI_INSTANCE_ID=')) ZAPI_INSTANCE_ID = line.split('=')[1].trim();
  if(line.startsWith('ZAPI_TOKEN=')) ZAPI_TOKEN = line.split('=')[1].trim();
  if(line.startsWith('ZAPI_CLIENT_TOKEN=')) ZAPI_CLIENT_TOKEN = line.split('=')[1].trim();
});

const options = {
  hostname: 'api.z-api.io',
  path: `/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}/chats`,
  method: 'GET',
  headers: {
    'Client-Token': ZAPI_CLIENT_TOKEN
  }
};

console.log('Buscando chats recentes na Z-API...');

const req = https.request(options, res => {
  let body = '';
  res.on('data', d => body += d);
  res.on('end', () => {
    try {
      const data = JSON.parse(body);
      console.log('\n✅ 5 GRUPOS/CHATS MAIS RECENTES:');
      data.slice(0, 5).forEach(c => {
         console.log(`Nome: "${c.name || 'Sem nome'}"`);
         console.log(`ID: ${c.phone}`);
         console.log('---');
      });
    } catch(e) {
      console.log('Erro ao ler dados:', e);
    }
  });
});
req.on('error', e => console.log('Erro na requisição:', e));
req.end();
