const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const count = await prisma.collaborator.count();
    console.log('\n====================================');
    console.log(`TOTAL DE COLABORADORES: ${count}`);
    console.log('====================================\n');
    
    if (count > 0) {
      const sample = await prisma.collaborator.findFirst();
      console.log('Exemplo de registro importado:');
      console.log('- Nome:', sample.name);
      console.log('- Secullum ID:', sample.secullumId);
    }
  } catch (e) {
    console.error('Erro:', e.message);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

check();
