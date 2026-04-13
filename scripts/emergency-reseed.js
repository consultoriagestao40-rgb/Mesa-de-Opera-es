const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Restaurando Configurações Nexus (Secullum + Z-API) ---');
  
  const configs = [
    // Secullum
    { key: 'SECULLUM_USERNAME', value: 'cristiano@grupojvsserv.com.br' },
    { key: 'SECULLUM_PASSWORD', value: '8Gmw.@DzuuHEz9' },
    { key: 'SECULLUM_DATABASE_ID', value: '85740' },
    { key: 'SECULLUM_CLIENT_ID', value: '3' },
    
    // Z-API (WhatsApp)
    { key: 'ZAPI_INSTANCE_ID', value: '3F1993DFB59E83474F059E648AE68DF9' },
    { key: 'ZAPI_TOKEN', value: '81087A6B5C1CAB8AAAC801C4' },
    { key: 'ZAPI_CLIENT_TOKEN', value: 'F5c1b8f27f6b049c98c4e779d00f67552S' },
    { key: 'WHATSAPP_GROUP_ID', value: '120363425022319430-group' },
    
    // System
    { key: 'NEXUS_SYSTEM_ACTIVE', value: 'true' }
  ];

  for (const config of configs) {
    await prisma.nexusConfig.upsert({
      where: { key: config.key },
      update: { value: config.value },
      create: { key: config.key, value: config.value }
    });
    console.log(`Configurada chave: ${config.key}`);
  }

  console.log('--- Sucesso! Todas as configurações foram restauradas ---');
}

main()
  .catch(e => {
    console.error('Erro ao restaurar:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
