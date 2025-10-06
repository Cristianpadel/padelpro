const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSchema() {
  try {
    console.log('📊 Checking Instructor table structure...\n');
    
    const result = await prisma.$queryRaw`PRAGMA table_info(Instructor)`;
    console.log('Instructor table structure:');
    console.table(result);
    
    // También verificar los usuarios asociados
    console.log('\n👥 Checking users linked to instructors...\n');
    const users = await prisma.$queryRaw`
      SELECT u.id, u.name, u.email, i.id as instructorId, i.clubId, i.hourlyRate, i.specialties
      FROM User u 
      INNER JOIN Instructor i ON u.id = i.userId
    `;
    
    console.log('Users linked to instructors:');
    console.table(users);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkSchema();