const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
    console.log('--- 🧪 TESTE DE CONEXÃO NEXUS → WHATSAPP ---');
    
    try {
        const configs = await prisma.nexusConfig.findMany();
        const instanceId = configs.find(c => c.key === 'ZAPI_INSTANCE_ID')?.value;
        const token = configs.find(c => c.key === 'ZAPI_TOKEN')?.value;
        const clientToken = configs.find(c => c.key === 'ZAPI_CLIENT_TOKEN')?.value;
        const groupId = configs.find(c => c.key === 'WHATSAPP_GROUP_ID')?.value;

        if (!instanceId || !token || !groupId) {
            console.error('❌ Faltam configurações no banco de dados!');
            return;
        }

        console.log(`Instância: ${instanceId}`);
        console.log(`Grupo: ${groupId}`);

        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
        const message = "✅ *NEXUS OPERACIONAL ATIVO* ✅\n\nIntegração concluída com sucesso! O sistema agora está monitorando o Secullum e pronto para enviar alertas neste grupo. 🚀";

        const res = await axios.post(url, {
            phone: groupId,
            message: message
        }, {
            headers: clientToken ? { 'Client-Token': clientToken } : {}
        });

        console.log('✅ Mensagem de teste enviada com sucesso!');
        console.log('Resposta Z-API:', res.data);

    } catch (e) {
        console.error('❌ Falha ao enviar mensagem:', e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
