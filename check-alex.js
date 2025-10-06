const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUser() {
  try {
    const users = await prisma.$queryRaw`
      SELECT id, name FROM User WHERE name LIKE '%Alex%'
    `;
    console.log('Usuario Alex:', users);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUser();