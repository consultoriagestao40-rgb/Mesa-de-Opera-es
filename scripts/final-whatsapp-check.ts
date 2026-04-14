import { sendWhatsAppMessage } from '../lib/whatsapp-service';
import prisma from '../lib/prisma';

async function run() {
    console.log('--- FINAL WHATSAPP CONNECTIVITY CHECK ---');
    const message = "✅ *CONEXÃO REESTABELECIDA* ✅\n\nO sistema Nexus Operacional voltou a se comunicar com este grupo. A partir de agora, apenas notificações de *PRIMEIRA BATIDA (ENTRADA)* serão enviadas.";
    
    // Attempt multiple times if needed
    for (let i = 0; i < 3; i++) {
        console.log(`Sending test message (Attempt ${i+1})...`);
        const result = await sendWhatsAppMessage('', message);
        if (result) {
            console.log('✅ TEST SUCCESSFUL!');
            return;
        }
        await new Promise(r => setTimeout(r, 2000));
    }
    console.log('❌ ALL ATTEMPTS FAILED.');
}
run();
