const { PrismaClient } = require('@prisma/client');

async function checkSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando estructura de TimeSlot...');
    const info = await prisma.$queryRaw`PRAGMA table_info(TimeSlot)`;
    console.log('TimeSlot structure:');
    console.log(info);
    
    console.log('\n🔍 Verificando datos existentes...');
    const clubs = await prisma.club.findMany();
    console.log(`Clubs: ${clubs.length}`);
    clubs.forEach(club => console.log(`  - ${club.name} (${club.id})`));
    
    const instructors = await prisma.instructor.findMany({ include: { user: true } });
    console.log(`Instructors: ${instructors.length}`);
    instructors.forEach(instructor => console.log(`  - ${instructor.user.name} (${instructor.id})`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSchema();