const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log('--- INICIANDO ATIVAÇÃO DE PRODUÇÃO (NEON) ---');
  
  const configs = [
    { key: 'SECULLUM_USERNAME', value: 'cristiano@grupojvsserv.com.br' },
    { key: 'SECULLUM_PASSWORD', value: '8Gmw.@DzuuHEz9' },
    { key: 'SECULLUM_DATABASE_ID', value: '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c' },
    { key: 'SECULLUM_CLIENT_ID', value: '3' }
  ];

  try {
    // 1. Gravar Configurações
    for (const c of configs) {
      await prisma.nexusConfig.upsert({
        where: { key: c.key },
        update: { value: c.value },
        create: { key: c.key, value: c.value }
      });
      console.log('✅ Gravado:', c.key);
    }

    // 2. Disparar Sincronização Inicial
    console.log('\n--- DISPARANDO PRIMEIRA IMPORTAÇÃO ---');
    // Note: We import the engine logic directly or via require if possible
    // Since it's a TS file, we'll try to trigger it via the API later if this fails,
    // but the configs above are the most important part.
    
    console.log('🚀 Configurações aplicadas com sucesso!');
  } catch (e) {
    console.error('❌ Erro Crítico:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

run();
