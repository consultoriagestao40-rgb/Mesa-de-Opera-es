import prisma from '../lib/prisma';

async function dump() {
    const collabs = await prisma.collaborator.findMany({ 
        where: { active: true },
        take: 10 
    });
    console.log('Nexus Collaborators PIS sampler:');
    collabs.forEach(c => console.log(`- ${c.name}: PIS=${c.pis}, secId=${c.secullumId}`));
}
dump();
