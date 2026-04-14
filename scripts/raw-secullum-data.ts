import { getScheduleByNumber } from '../lib/secullum-service';

async function run() {
    const res = await getScheduleByNumber(14);
    console.log('RAW SCHEDULE 14:', JSON.stringify(res, null, 2));
}
run();
