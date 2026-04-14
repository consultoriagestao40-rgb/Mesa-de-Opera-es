import { getEmployees, getScheduleByNumber } from '../lib/secullum-service';

async function run() {
    console.log('--- CHECKING JAYSSON (410) SCHEDULE ---');
    const employees = await getEmployees();
    const jEmp = employees.find((e: any) => e.Id?.toString() === '410');
    
    if (!jEmp) {
        console.log('Employee 410 not found');
        return;
    }

    console.log('Employee:', jEmp.Nome);
    console.log('Schedule Number:', jEmp.Horario?.Numero);

    const schedule = await getScheduleByNumber(jEmp.Horario?.Numero);
    console.log('Schedule Dias:', JSON.stringify(schedule.Dias, null, 2));

    const now = new Date();
    const brazilNow = new Date(now.getTime() - 3 * 60 * 60 * 1000);
    console.log('Brazil Now JS Day:', brazilNow.getDay());
}
run();
