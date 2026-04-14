import { getEmployees } from '../lib/secullum-service';
async function test() {
    const emps = await getEmployees();
    if (emps.length > 0) {
        console.log(JSON.stringify(emps[0], null, 2));
    }
}
test();
