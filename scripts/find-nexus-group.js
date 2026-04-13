const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const prisma = new PrismaClient();

async function main() {
    try {
        const configs = await prisma.nexusConfig.findMany();
        const instanceId = configs.find(c => c.key === 'ZAPI_INSTANCE_ID')?.value?.trim();
        const token = configs.find(c => c.key === 'ZAPI_TOKEN')?.value?.trim();
        const clientToken = configs.find(c => c.key === 'ZAPI_CLIENT_TOKEN')?.value?.trim();

        if (!instanceId || !token) {
            console.error('❌ Configurações ZAPI faltando no banco!');
            return;
        }

        console.log(`🔍 Buscando grupos no Z-API (Instância: ${instanceId})...`);
        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/chats`;
        
        const res = await axios.get(url, {
            headers: clientToken ? { 'Client-Token': clientToken } : {}
        });

        const allChats = res.data || [];
        const targetName = "Mesa de Operações";
        
        console.log(`--- Resultados (${allChats.length} chats encontrados) ---`);
        
        const group = allChats.find(c => 
            (c.name || c.subject || '').toLowerCase().includes(targetName.toLowerCase())
        );

        if (group) {
            const groupId = group.phone || group.id;
            console.log(`✅ GRUPO ENCONTRADO!`);
            console.log(`Nome: ${group.name || group.subject}`);
            console.log(`ID: ${groupId}`);
            
            // Auto-update the config
            await prisma.nexusConfig.upsert({
                where: { key: 'WHATSAPP_GROUP_ID' },
                update: { value: groupId },
                create: { key: 'WHATSAPP_GROUP_ID', value: groupId }
            });
            console.log(`🚀 Configuração WHATSAPP_GROUP_ID atualizada com sucesso!`);
        } else {
            console.log(`❌ Grupo "${targetName}" não encontrado.`);
            console.log('Grupos disponíveis:');
            allChats
                .filter(c => c.isGroup || c.id?.includes('@g.us'))
                .forEach(g => console.log(` - ${g.name || g.subject} (${g.phone || g.id})`));
        }

    } catch (e) {
        console.error('❌ Falha na integração:', e.response?.data || e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
