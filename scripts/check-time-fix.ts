import { formatInTimeZone } from 'date-fns-tz';

async function run() {
    const now = new Date();
    // Use date-fns-tz if available, otherwise manual calc
    const brHour = new Intl.DateTimeFormat('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        hour: 'numeric',
        hour12: false
    }).format(now);

    console.log('Real Brazil Hour:', brHour);
}
run();
