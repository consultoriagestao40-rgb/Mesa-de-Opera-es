import prisma from '../lib/prisma';

async function run() {
    console.log('--- ENFORCING ENTRADA-ONLY ALERTS ---');
    // We don't need a DB flag if we change the code, but let's check if the group ID is still OK.
    const group = await prisma.nexusConfig.findFirst({ where: { key: 'WHATSAPP_GROUP_ID' } });
    console.log('Current Group ID:', group?.value);
}
run();
