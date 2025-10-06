const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClubs() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        admin: true
      }
    });
    
    console.log('🏢 Clubes en la base de datos:', clubs.length);
    
    clubs.forEach((club, i) => {
      console.log(`  ${i+1}. "${club.name}" - ID: ${club.id}`);
      console.log(`     Admin: ${club.admin ? club.admin.name : 'Sin admin'}`);
      console.log(`     Location: ${club.location || 'Sin ubicación'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClubs();