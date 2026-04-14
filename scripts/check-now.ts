import prisma from '../lib/prisma';
async function run() {
   console.log('UTC NOW:', new Date().toISOString());
   const brazilNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
   console.log('BRAZIL NOW (calc):', brazilNow.toISOString());
   console.log('Current Hour:', brazilNow.getHours());
}
run();
