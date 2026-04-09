import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@mesadeoperacoes.com.br';
    const password = 'admin123';
    const password_hash = await bcrypt.hash(password, 10);

    console.log(`Creating admin user: ${email}...`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            password_hash,
            active: true,
            role: 'ADMIN' as any
        },
        create: {
            email,
            name: 'Administrador Mesa',
            password_hash,
            role: 'ADMIN' as any,
            active: true
        }
    });

    console.log('✅ Admin user created/updated successfully!');
}

main()
    .catch((e) => {
        console.error('❌ Error creating user:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
