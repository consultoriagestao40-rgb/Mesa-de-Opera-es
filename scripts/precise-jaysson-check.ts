import { getEmployees, getScheduleByNumber } from '../lib/secullum-service';

async function run() {
    const employees = await getEmployees();
    const jEmp = employees.find((e: any) => e.Id?.toString() === '410');
    console.log('--- JAYSSON (410) ---');
    console.log('Name:', jEmp.Nome);
    console.log('Actual Schedule Info:', JSON.stringify(jEmp.Horario, null, 2));
    
    const schedule = await getScheduleByNumber(jEmp.Horario?.Numero);
    const day1 = schedule.Dias?.find((d: any) => d.DiaSemana === 1); // Tuesday
    console.log('Tuesday Schedule:', JSON.stringify(day1, null, 2));
}
run();
