import prisma from '../lib/prisma';

async function register() {
  const ID = '4a2ff5a0-11ab-48fb-8f36-f97ca5af700c';
  console.log(`--- REGISTRANDO SECULLUM DATABASE ID: ${ID} ---`);
  
  try {
    await prisma.nexusConfig.upsert({
      where: { key: 'SECULLUM_DATABASE_ID' },
      update: { value: ID },
      create: { key: 'SECULLUM_DATABASE_ID', value: ID }
    });
    console.log('✅ ID Registrado com sucesso no banco de dados!');
  } catch (e) {
    console.error('❌ Erro ao registrar ID:', e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

register();
