// debug-club-structure.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugClubStructure() {
  try {
    console.log('🔍 Testing direct Prisma club query with all fields...');
    
    const club = await prisma.club.findFirst();
    if (club) {
      console.log('✅ Sample club structure:');
      console.log(JSON.stringify(club, null, 2));
    } else {
      console.log('❌ No clubs found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugClubStructure();