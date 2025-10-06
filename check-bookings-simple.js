// check-bookings-simple.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('📋 Checking all bookings in database...');
    
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        timeSlot: true
      }
    });
    
    console.log(`📊 Total bookings found: ${bookings.length}`);
    
    if (bookings.length > 0) {
      console.log('\n📋 Booking details:');
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ID: ${booking.id}`);
        console.log(`   User: ${booking.user.name} (${booking.userId})`);
        console.log(`   TimeSlot: ${booking.timeSlotId}`);
        console.log(`   Group Size: ${booking.groupSize}`);
        console.log(`   Status: ${booking.status}`);
        console.log(`   Created: ${booking.createdAt}`);
        console.log('   ---');
      });
    } else {
      console.log('❌ No bookings found in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();