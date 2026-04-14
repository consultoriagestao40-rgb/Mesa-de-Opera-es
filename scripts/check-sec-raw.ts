import { getEmployees } from '../lib/secullum-service';
async function run() {
    const emps = await getEmployees();
    const adrian = emps.find((e: any) => e.Nome?.includes('ADRIAN PENA RAMIREZ'));
    console.log('ADRIAN RAW:', JSON.stringify(adrian, null, 2));
}
run();
