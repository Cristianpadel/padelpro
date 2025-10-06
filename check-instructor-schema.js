const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInstructorSchema() {
  try {
    const result = await prisma.$queryRaw`PRAGMA table_info(Instructor)`;
    console.log('Instructor table structure:', result);
    
    const existing = await prisma.$queryRaw`SELECT * FROM Instructor LIMIT 5`;
    console.log('Existing instructors:', existing);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructorSchema();