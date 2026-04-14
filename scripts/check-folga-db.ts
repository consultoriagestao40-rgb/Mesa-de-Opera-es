import prisma from '../lib/prisma';

async function check() {
    const names = ['ADRIAN PENA RAMIREZ', 'GENESIS GABRIELA MARTINEZ GONZALEZ', 'SANDRA PEREIRA MOREIRA'];
    console.log('--- STATUS ATUAL NO DB PARA NOMES DE FOLGA ---');
    for (const name of names) {
        const c = await prisma.collaborator.findFirst({ where: { name: { contains: name } } });
        console.log(`- ${name}: Status='${c?.status}', Active=${c?.active}, Dept='${c?.departamento}'`);
    }
}
check();
