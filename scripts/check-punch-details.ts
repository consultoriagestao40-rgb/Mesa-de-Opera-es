import { getPunches } from '../lib/secullum-service';
import { format } from 'date-fns';

async function test() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const punches = await getPunches(today, today);
    console.log('Sample Punch keys:', Object.keys(punches[0] || {}));
    console.log('Sample Punch details:', JSON.stringify(punches[0], null, 2));
}
test();
