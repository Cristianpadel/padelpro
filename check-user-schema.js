// check-user-schema.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserSchema() {
  try {
    // Get table info using raw SQL
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(User)`;
    
    console.log('User table schema:');
    tableInfo.forEach(column => {
      console.log(`- ${column.name}: ${column.type} (nullable: ${column.notnull === 0})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserSchema();