// check-clubs-simple.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClubs() {
  try {
    console.log('🏢 Checking all clubs in database...');
    
    const clubs = await prisma.club.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log(`📊 Total clubs found: ${clubs.length}`);
    
    if (clubs.length > 0) {
      console.log('\n🏢 Club details:');
      clubs.forEach((club, index) => {
        console.log(`${index + 1}. ID: ${club.id}`);
        console.log(`   Name: ${club.name}`);
        console.log(`   Address: ${club.address || 'No address'}`);
        console.log(`   Phone: ${club.phone || 'No phone'}`);
        console.log(`   Email: ${club.email || 'No email'}`);
        console.log(`   Price/Hour: €${club.pricePerHour}`);
        console.log(`   Active: ${club.isActive}`);
        console.log(`   Created: ${club.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No clubs found in database');
    }
    
    // También verificar si hay referencias a "Padel Estrella" en los TimeSlots
    console.log('\n🔍 Checking TimeSlots for club references...');
    const timeSlots = await prisma.timeSlot.findMany({
      include: {
        club: true
      },
      take: 5
    });
    
    console.log(`📊 Sample TimeSlots (first 5):`);
    timeSlots.forEach((slot, index) => {
      console.log(`${index + 1}. TimeSlot ${slot.id.substring(0, 8)}...`);
      console.log(`   Club: ${slot.club.name} (${slot.clubId})`);
      console.log(`   Start: ${slot.start}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClubs();