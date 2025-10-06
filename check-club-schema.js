const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClubSchema() {
  try {
    const result = await prisma.$queryRaw`PRAGMA table_info(Club)`;
    console.log('Club table structure:', result);
    
    const existing = await prisma.$queryRaw`SELECT * FROM Club LIMIT 1`;
    console.log('Existing clubs:', existing);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClubSchema();