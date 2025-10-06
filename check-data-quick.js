const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  console.log('🔍 Checking database...');
  
  const instructors = await prisma.instructor.findMany();
  console.log('👨‍🏫 Instructores:', instructors.length);
  instructors.forEach(i => console.log(`  - ${i.id}: ${i.name || 'Sin nombre'} (Club: ${i.clubId})`));
  
  // Use raw query to avoid field validation issues
  const courts = await prisma.$queryRaw`SELECT id, clubId, number FROM Court`;
  console.log('🎾 Pistas:', courts.length);
  courts.forEach(c => console.log(`  - ${c.id}: Pista ${c.number} (Club: ${c.clubId})`));
  
  await prisma.$disconnect();
}

checkData().catch(console.error);