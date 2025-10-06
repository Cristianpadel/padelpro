// Check Padel Estrella club ID
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClubId() {
  try {
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' }
    });

    if (club) {
      console.log('\n✅ Padel Estrella club found:');
      console.log('   ID:', club.id);
      console.log('   Name:', club.name);
      console.log('\n💡 Use this ID in mock system: club-padel-estrella');
    } else {
      console.log('❌ Padel Estrella club not found');
    }

    // Also check all clubs
    const allClubs = await prisma.club.findMany();
    console.log('\n📋 All clubs in database:');
    allClubs.forEach(c => {
      console.log(`   - ${c.name} (${c.id})`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClubId();
