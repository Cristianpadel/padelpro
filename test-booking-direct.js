// Test booking API directly
const { PrismaClient } = require('@prisma/client');

async function testBooking() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Testing booking logic...');
    
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: 'user-1' }
    });
    console.log('User exists:', user ? 'YES' : 'NO');
    
    // Check if slot exists
    const slot = await prisma.timeSlot.findUnique({
      where: { id: 'slot-2025-09-15-court-1-09:00' }
    });
    console.log('Slot exists:', slot ? 'YES' : 'NO');
    
    if (!user || !slot) {
      console.log('❌ Missing user or slot!');
      return;
    }
    
    // Try to create booking
    const booking = await prisma.booking.create({
      data: {
        userId: 'user-1',
        timeSlotId: 'slot-2025-09-15-court-1-09:00',
        groupSize: 1,
        status: 'PENDING'
      }
    });
    
    console.log('✅ Booking created:', booking.id);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBooking();