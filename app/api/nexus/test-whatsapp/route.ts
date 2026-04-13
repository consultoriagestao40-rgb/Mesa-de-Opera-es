import { NextResponse } from 'next/server';
import { sendWhatsAppMessage } from '@/lib/whatsapp-service';

export const dynamic = 'force-dynamic';

export async function POST() {
    const testMessage = `✅ *Nexus Operacional — Teste de Conexão*\n\nSistema conectado com sucesso!\nO monitoramento de ponto está ativo e os alertas serão enviados neste grupo.\n\n🕒 ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`;
    
    const success = await sendWhatsAppMessage('', testMessage);
    
    if (success) {
        return NextResponse.json({ success: true, message: 'Mensagem de teste enviada!' });
    } else {
        return NextResponse.json({ success: false, message: 'Falha ao enviar. Verifique as credenciais Z-API nas configurações.' }, { status: 500 });
    }
}
