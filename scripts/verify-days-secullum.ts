import { getScheduleByNumber } from '../lib/secullum-service';

async function run() {
    const res = await getScheduleByNumber(14);
    const schedule = Array.isArray(res) ? res[0] : res;
    
    schedule.Dias.slice(0, 7).forEach((d: any) => {
        console.log(`DiaSemana: ${d.DiaSemana} | E1: ${d.Entrada1} | S1: ${d.Saida1}`);
    });
}
run();
