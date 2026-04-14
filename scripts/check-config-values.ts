import prisma from '../lib/prisma';
async function run() {
    const configs = await prisma.nexusConfig.findMany();
    console.log('--- NEXUS CONFIG IN DB ---');
    configs.forEach(c => {
        if (c.key.includes('TOKEN')) {
            console.log(`- ${c.key}: [REDACTED]`);
        } else {
            console.log(`- ${c.key}: ${c.value}`);
        }
    });
}
run();
