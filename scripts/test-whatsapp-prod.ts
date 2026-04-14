import { sendWhatsAppMessage } from '../lib/whatsapp-service';
import prisma from '../lib/prisma';

async function run() {
    console.log('--- TESTING WHATSAPP PROD ---');
    const config = await prisma.nexusConfig.findMany();
    console.log('Current Config Keys:', config.map(c => c.key));
    
    const message = "🚀 *NEXUS OPERACIONAL* 🚀\n\nTeste de conectividade do sistema. Se você recebeu esta mensagem, a integração Z-API está ATIVA.";
    
    console.log('Sending message to default group...');
    const result = await sendWhatsAppMessage('', message);
    
    if (result) {
        console.log('✅ Message sent successfully!');
    } else {
        console.log('❌ Failed to send message. Check logs/config.');
    }
}
run();
