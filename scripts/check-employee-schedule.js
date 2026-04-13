const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getEmployees, getScheduleByNumber } = require('./lib/secullum-service');

async function main() {
    const name = 'ADRIANA CRISTINA DA SILVA';
    const collabs = await prisma.collaborator.findMany({
        where: { name: { contains: name } }
    });
    
    if (collabs.length === 0) {
        console.log('Colaborador não encontrado.');
        return;
    }
    
    const collab = collabs[0];
    console.log(`Colaborador: ${collab.name} (Secullum ID: ${collab.secullumId})`);
    
    const employees = await getEmployees();
    const emp = employees.find(e => e.Id.toString() === collab.secullumId);
    
    if (!emp) {
        console.log('Não encontrado na API Secullum.');
        return;
    }
    
    console.log(`Horário Numero: ${emp.Horario.Numero}`);
    const schedule = await getScheduleByNumber(emp.Horario.Numero);
    const dayOfWeek = (new Date().getDay()); // 0=Sunday, 1=Monday...
    
    const todaySchedule = schedule[0].Dias.find(d => d.DiaSemana === dayOfWeek);
    console.log('Horário de Hoje no Secullum:');
    console.log(`- Entrada1: ${todaySchedule.Entrada1}`);
    console.log(`- Saida1: ${todaySchedule.Saida1}`);
    console.log(`- Entrada2: ${todaySchedule.Entrada2}`);
    console.log(`- Saida2: ${todaySchedule.Saida2}`);
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
