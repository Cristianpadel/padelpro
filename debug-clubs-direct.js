// debug-clubs-direct.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClubs() {
  try {
    console.log('🔍 Testing direct Prisma club query...');
    
    const clubs = await prisma.club.findMany();
    console.log('✅ Found clubs:', clubs.length);
    
    clubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name} (${club.id})`);
      console.log(`   AdminId: ${club.adminId}`);
      console.log(`   Address: ${club.address}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugClubs();