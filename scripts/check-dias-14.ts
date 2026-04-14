import { getScheduleByNumber } from '../lib/secullum-service';

async function run() {
    const res = await getScheduleByNumber(14);
    const schedule = Array.isArray(res) ? res[0] : res;
    console.log('Dias count:', schedule.Dias?.length);
    schedule.Dias?.forEach((d: any) => {
        console.log(`Dia: ${d.DiaSemana} | E1: ${d.Entrada1} | S1: ${d.Saida1}`);
    });
}
run();
