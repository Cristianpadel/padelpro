// Test multi-modal booking system
const { PrismaClient } = require('@prisma/client');

async function testMultiModal() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing multi-modal booking system...');
    
    const timeSlotId = 'slot-2025-09-15-court-1-11:00';
    
    // Create multiple bookings for different group sizes
    console.log('\n1️⃣ User-1 books for 1 player');
    await prisma.booking.create({
      data: {
        userId: 'user-1',
        timeSlotId: timeSlotId,
        groupSize: 1,
        status: 'PENDING'
      }
    });
    
    console.log('2️⃣ User-2 books for 2 players');
    await prisma.booking.create({
      data: {
        userId: 'user-2',
        timeSlotId: timeSlotId,
        groupSize: 2,
        status: 'PENDING'
      }
    });
    
    console.log('3️⃣ User-3 books for 2 players (COMPLETES 2p modalidad!)');
    await prisma.booking.create({
      data: {
        userId: 'user-3',
        timeSlotId: timeSlotId,
        groupSize: 2,
        status: 'PENDING'
      }
    });
    
    // Now check the confirmation logic
    console.log('\n🔍 Checking if 2p modalidad should be confirmed...');
    const pendingTwoPlayers = await prisma.booking.count({
      where: {
        timeSlotId: timeSlotId,
        groupSize: 2,
        status: 'PENDING'
      }
    });
    
    console.log(`Found ${pendingTwoPlayers} pending 2-player bookings`);
    
    if (pendingTwoPlayers >= 2) {
      console.log('🎉 Confirming 2-player modalidad!');
      
      // Confirm 2-player bookings
      await prisma.booking.updateMany({
        where: {
          timeSlotId: timeSlotId,
          groupSize: 2,
          status: 'PENDING'
        },
        data: {
          status: 'CONFIRMED'
        }
      });
      
      // Get confirmed users
      const confirmedUsers = await prisma.booking.findMany({
        where: {
          timeSlotId: timeSlotId,
          groupSize: 2,
          status: 'CONFIRMED'
        },
        select: { userId: true }
      });
      
      // Cancel other bookings for these users
      for (const user of confirmedUsers) {
        await prisma.booking.updateMany({
          where: {
            timeSlotId: timeSlotId,
            userId: user.userId,
            groupSize: { not: 2 },
            status: 'PENDING'
          },
          data: {
            status: 'CANCELLED'
          }
        });
      }
      
      console.log('✅ Modalidad 2p confirmed and other bookings cancelled!');
    }
    
    // Show final state
    console.log('\n📊 Final booking state:');
    const allBookings = await prisma.booking.findMany({
      where: { timeSlotId: timeSlotId },
      include: { user: true }
    });
    
    allBookings.forEach(b => {
      console.log(`  ${b.user.name}: ${b.groupSize}p - ${b.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testMultiModal();