/**
 * Test filter logic for WhatsApp group notifications
 */
console.log('--- TESTE: LÓGICA DE FILTRO DO GRUPO DE OPERAÇÕES ---');

function isCollabAllowed(collab, rules) {
    if (!collab) return false;
    if (!rules) return true;

    const collabId = collab.id;
    const posto = (collab.posto || 'Geral').trim();

    // 1. Exceção individual de colaborador
    if (rules.disabledCollaboratorIds && rules.disabledCollaboratorIds.includes(collabId)) {
        return false;
    }
    if (rules.enabledCollaboratorIds && rules.enabledCollaboratorIds.includes(collabId)) {
        return true;
    }

    // 2. Filtro por contrato/posto
    if (rules.disabledContracts && rules.disabledContracts.includes(posto)) {
        return false;
    }

    return true;
}

const collab1 = { id: 'c1', name: 'João Penha', posto: 'Empresa Penha' };
const collab2 = { id: 'c2', name: 'Maria Penha', posto: 'Empresa Penha' };
const collab3 = { id: 'c3', name: 'Carlos Shopping', posto: 'Shopping Plaza' };

// Scenario 1: Default (no rules) -> all allowed
const rules1 = { disabledContracts: [], disabledCollaboratorIds: [], enabledCollaboratorIds: [] };
console.assert(isCollabAllowed(collab1, rules1) === true, 'C1 deve estar permitido no default');
console.assert(isCollabAllowed(collab3, rules1) === true, 'C3 deve estar permitido no default');

// Scenario 2: Disable "Empresa Penha" -> collab1 & collab2 disabled, collab3 allowed
const rules2 = { disabledContracts: ['Empresa Penha'], disabledCollaboratorIds: [], enabledCollaboratorIds: [] };
console.assert(isCollabAllowed(collab1, rules2) === false, 'C1 deve ser silenciado por contrato');
console.assert(isCollabAllowed(collab2, rules2) === false, 'C2 deve ser silenciado por contrato');
console.assert(isCollabAllowed(collab3, rules2) === true, 'C3 deve continuar permitido');

// Scenario 3: Disable "Empresa Penha", but add collab1 as explicit enabled override
const rules3 = { 
    disabledContracts: ['Empresa Penha'], 
    disabledCollaboratorIds: [], 
    enabledCollaboratorIds: ['c1'] 
};
console.assert(isCollabAllowed(collab1, rules3) === true, 'C1 deve estar permitido por exceção individual');
console.assert(isCollabAllowed(collab2, rules3) === false, 'C2 deve continuar silenciado');

// Scenario 4: "Shopping Plaza" active, but silence collab3 individually
const rules4 = {
    disabledContracts: [],
    disabledCollaboratorIds: ['c3'],
    enabledCollaboratorIds: []
};
console.assert(isCollabAllowed(collab3, rules4) === false, 'C3 deve estar silenciado individualmente');
console.assert(isCollabAllowed(collab1, rules4) === true, 'C1 deve estar permitido');

console.log('✅ Todos os cenários de filtro de contratos e colaboradores passaram com sucesso!');
