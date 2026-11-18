import axios from 'axios';
import prisma from './prisma';

/**
 * Nexus WhatsApp Service (Z-API Integration)
 * Focado especificamente no monitoramento do Nexus Operacional.
 */

let lastSendTimestamp = 0;
let nexusQueueChain: Promise<any> = Promise.resolve();

/**
 * Função utilitária com enfileiramento sequencial obrigatório (Anti-Bloqueio).
 * Garante retardo humano estrito de 5 a 10 segundos entre cada envio,
 * impedindo que disparo para grupo e disparo para colaborador ocorram no mesmo instante.
 */
export async function enforceAntiSpamDelay(minMs: number = 5000, maxMs: number = 10000): Promise<void> {
    const nextExecution = nexusQueueChain.then(async () => {
        const now = Date.now();
        const timeSinceLast = now - lastSendTimestamp;
        const targetDelay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

        if (timeSinceLast < targetDelay && lastSendTimestamp > 0) {
            const waitTime = targetDelay - timeSinceLast;
            console.log(`[Anti-Spam Nexus] 🛡️ Retardo ativo: aguardando ${(waitTime / 1000).toFixed(1)}s antes do próximo envio...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        lastSendTimestamp = Date.now();
    });

    nexusQueueChain = nextExecution.catch(() => {});
    return nextExecution;
}

export async function sendWhatsAppMessage(to: string, message: string) {
    try {
        // Enforce anti-spam throttle (5 a 10s)
        await enforceAntiSpamDelay(5000, 10000);

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
