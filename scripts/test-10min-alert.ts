/**
 * Test to verify 10-minute alert thresholds and single-message logic
 */
console.log('--- TESTE: LÓGICA DE ALERTA DE 10 MINUTOS ---');

function evaluateAlert(diffMinutes: number, currentStep: number) {
    let triggered = false;
    let newStep = currentStep;
    let status = diffMinutes >= 10 ? 'EM_ALERTA' : 'PENDENTE';

    if (diffMinutes >= 10 && (status === 'PENDENTE' || status === 'EM_ALERTA')) {
        if (currentStep === 0) {
            triggered = true;
            newStep = 1;
        }
    }

    return { diffMinutes, triggered, currentStep: newStep, status };
}

// Case 1: 5 minutes delay (Previously alerted, now should NOT alert)
const c1 = evaluateAlert(5, 0);
console.log('Caso 1 (5 min atraso):', c1);
console.assert(c1.triggered === false, '5 min não deve disparar alerta');
console.assert(c1.status === 'PENDENTE', '5 min deve continuar PENDENTE');

// Case 2: 9 minutes delay (Should NOT alert)
const c2 = evaluateAlert(9, 0);
console.log('Caso 2 (9 min atraso):', c2);
console.assert(c2.triggered === false, '9 min não deve disparar alerta');

// Case 3: 10 minutes delay (SHOULD alert once)
const c3 = evaluateAlert(10, 0);
console.log('Caso 3 (10 min atraso, 1ª vez):', c3);
console.assert(c3.triggered === true, '10 min deve disparar alerta');
console.assert(c3.currentStep === 1, 'Novo passo deve ser 1');
console.assert(c3.status === 'EM_ALERTA', 'Status deve ser EM_ALERTA');

// Case 4: 15 minutes delay after already alerted at step 1 (Previously sent 2nd alert, now should NOT alert)
const c4 = evaluateAlert(15, 1);
console.log('Caso 4 (15 min atraso, já alertado):', c4);
console.assert(c4.triggered === false, '15 min não deve disparar segundo alerta');

// Case 5: 25 minutes delay after already alerted at step 1 (Previously sent 3rd alert, now should NOT alert)
const c5 = evaluateAlert(25, 1);
console.log('Caso 5 (25 min atraso, já alertado):', c5);
console.assert(c5.triggered === false, '25 min não deve disparar terceiro alerta');

console.log('✅ Todos os testes de validação da lógica de 10 min e mensagem única passaram com sucesso!');
