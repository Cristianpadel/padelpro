const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectDatabase() {
  try {
    console.log('=== DATABASE INSPECTION ===');
    
    // Try to get table info
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table';
    `;
    console.log('Tables:', tables);
    
    // Try to get Instructor table schema
    try {
      const instructorSchema = await prisma.$queryRaw`
        PRAGMA table_info(Instructor);
      `;
      console.log('Instructor table schema:', instructorSchema);
    } catch (e) {
      console.log('Instructor table does not exist');
    }
    
    // Check if we can create a simple club
    try {
      const club = await prisma.club.findFirst();
      console.log('Existing club:', club);
    } catch (e) {
      console.log('Error accessing club:', e.message);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectDatabase().finally(() => prisma.$disconnect());
