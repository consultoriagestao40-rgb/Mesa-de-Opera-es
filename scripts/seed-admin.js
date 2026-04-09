const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@mesadeoperacoes.com.br';
    const password = 'admin123';
    
    console.log('--- NEXUS OPERACIONAL: SEEDING ADMIN ---');
    
    try {
        const password_hash = await bcrypt.hash(password, 10);

        const user = await prisma.user.upsert({
            where: { email },
            update: {
                password_hash,
                active: true,
                role: 'ADMIN'
            },
            create: {
                email,
                name: 'Administrador Nexus',
                password_hash,
                role: 'ADMIN',
                active: true
            }
        });

        console.log('✅ SUCCESS: Nexus Admin is ready.');
        console.log(`User ID: ${user.id}`);
    } catch (error) {
        console.error('❌ ERROR during seeding:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
