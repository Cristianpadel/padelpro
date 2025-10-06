// debug-user-structure.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugUserStructure() {
  try {
    console.log('🔍 Checking User table structure...');
    
    const user = await prisma.$queryRaw`
      SELECT * FROM User LIMIT 1
    `;
    
    if (user.length > 0) {
      console.log('✅ Sample user structure:');
      console.log(JSON.stringify(user[0], null, 2));
    } else {
      console.log('❌ No users found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugUserStructure();