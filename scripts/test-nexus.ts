import { processNexusCycle } from '../lib/nexus-engine';

/**
 * Script de Teste Manual - Nexus Operacional
 * 
 * Este script força uma rodada completa de sincronização com a Secullum.
 * Use para validar se as credenciais cadastradas estão funcionando 
 * e se as batidas estão sendo detectadas corretamente.
 * 
 * Uso: npx tsx scripts/test-nexus.ts
 */

async function main() {
    console.log('\n--- 🚀 INICIANDO TESTE DE SINCRONIZAÇÃO NEXUS 🚀 ---');
    console.log('Alvo: Secullum Ponto Web -> Nexus Operacional\n');

    try {
        const result = await processNexusCycle();
        console.log('\n✅ CICLO CONCLUÍDO COM SUCESSO!');
        console.log('Timestamp:', result.timestamp);
        console.log('\nVerifique o Dashboard do Nexus para ver os alertas gerados.');
    } catch (error: any) {
        console.error('\n❌ FALHA NO TESTE DE INTEGRAÇÃO:');
        console.error('Mensagem:', error.message);
        console.error('\nDICA: Verifique se o SECULLUM_USERNAME, PASSWORD e DATABASE_ID estão corretos no Painel de Configurações.');
    }
}

main();
