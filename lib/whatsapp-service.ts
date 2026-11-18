import axios from 'axios';
import prisma from './prisma';

/**
 * Nexus WhatsApp Service (Z-API Integration)
 * Focado especificamente no monitoramento do Nexus Operacional.
 */

let lastSendTimestamp = 0;

/**
 * Função utilitária para garantir intervalo humano mínimo entre mensagens (Anti-Bloqueio).
 * Aguarda entre minMs e maxMs (default: 6 a 12 segundos) caso a última mensagem tenha
 * sido enviada recentemente.
 */
export async function enforceAntiSpamDelay(minMs: number = 6000, maxMs: number = 11000): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - lastSendTimestamp;
    const targetDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

    if (timeSinceLast < targetDelay) {
        const waitTime = targetDelay - timeSinceLast;
        console.log(`[Anti-Spam] 🛡️ Aguardando ${Math.round(waitTime / 1000)}s antes do próximo envio de WhatsApp...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastSendTimestamp = Date.now();
}

export async function sendWhatsAppMessage(to: string, message: string) {
    try {
        // Enforce anti-spam throttle
        await enforceAntiSpamDelay(6000, 10000);

        // Fetch config from database for Z-API
        const configs = await prisma.nexusConfig.findMany();
        const instanceId = configs.find(c => c.key === 'ZAPI_INSTANCE_ID')?.value || process.env.ZAPI_INSTANCE_ID;
        const token = configs.find(c => c.key === 'ZAPI_TOKEN')?.value || process.env.ZAPI_TOKEN;
        const clientToken = configs.find(c => c.key === 'ZAPI_CLIENT_TOKEN')?.value || process.env.ZAPI_CLIENT_TOKEN;
        
        // Target ID can be a group or individual
        const targetId = to || configs.find(c => c.key === 'WHATSAPP_GROUP_ID')?.value || process.env.WHATSAPP_GROUP_ID;

        if (!instanceId || !token || !targetId) {
            console.error('[Nexus WhatsApp] Missing Z-API configuration');
            return false;
        }

        const url = `https://api.z-api.io/instances/${instanceId}/token/${token}/send-text`;
        
        await axios.post(url, {
            phone: targetId,
            message: message
        }, {
            headers: clientToken ? { 'Client-Token': clientToken } : {}
        });

        console.log(`[Nexus WhatsApp] Message sent successfully to ${targetId}`);
        return true;
    } catch (error: any) {
        console.error('[Nexus WhatsApp] Failed to send message:', error.response?.data || error.message);
        return false;
    }
}
