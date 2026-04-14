import { getAfastamentos } from './lib/secullum-service';
import { format } from 'date-fns';

async function test() {
    const today = format(new Date(), 'yyyy-MM-dd');
    const data = await getAfastamentos(today, today);
    console.log('AFASTAMENTOS KEYS:', Object.keys(data[0] || {}));
    console.log('FIRST AFASTAMENTO:', JSON.stringify(data[0], null, 2));
}
test();
