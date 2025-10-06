const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Verificando datos existentes...');
    
    const instructors = await prisma.$queryRaw`SELECT id, name FROM Instructor`;
    console.log('👨‍🏫 Instructores disponibles:', instructors);
    
    const courts = await prisma.$queryRaw`SELECT id, number FROM Court`;
    console.log('🏟️ Courts disponibles:', courts);
    
    const clubs = await prisma.$queryRaw`SELECT id, name FROM Club`;
    console.log('🏢 Clubs disponibles:', clubs);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();