const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Restaurando Credenciais Secullum na Produção (Neon) ---');
  
  const config = await prisma.nexusConfig.upsert({
    where: { id: 'default' },
    update: {
      username: 'cristiano@grupojvsserv.com.br',
      password: '8Gmw.@DzuuHEz9',
      databaseId: '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c',
      clientId: '3'
    },
    create: {
      id: 'default',
      username: 'cristiano@grupojvsserv.com.br',
      password: '8Gmw.@DzuuHEz9',
      databaseId: '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c',
      clientId: '3'
    }
  });

  console.log('Sucesso! Credenciais de produção restauradas para:', config.username);
}

main()
  .catch(e => {
    console.error('Erro ao restaurar:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
