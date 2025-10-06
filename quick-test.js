const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function quickTest() {
  try {
    console.log('🧪 Quick test - Creating booking with groupSize=4...');
    
    // 1. Get first available slot
    const slot = await prisma.timeSlot.findFirst({
      where: {
        start: { gte: new Date() } // Future slots only
      },
      orderBy: { start: 'asc' }
    });
    
    if (!slot) {
      console.log('❌ No slots found');
      return;
    }
    
    console.log('📅 Using slot:', slot.id, new Date(slot.start).toLocaleString());
    
    // 2. Create booking with groupSize=4
    const bookingId = `test-${Date.now()}`;
    const booking = await prisma.booking.create({
      data: {
        id: bookingId,
        userId: 'cmfwmut4v0001tgs0en3il18d', // Alex García
        timeSlotId: slot.id,
        groupSize: 4,
        status: 'CONFIRMED'
      }
    });
    
    console.log('✅ Created booking:', booking.id, 'with groupSize:', booking.groupSize);
    
    // 3. Verify in database
    const saved = await prisma.booking.findUnique({
      where: { id: booking.id }
    });
    
    console.log('✅ Verified in DB:', {
      id: saved.id,
      groupSize: saved.groupSize,
      status: saved.status
    });
    
    // 4. Test API endpoint
    try {
      const response = await fetch(`http://localhost:3000/api/classes/${slot.id}/bookings`);
      if (response.ok) {
        const apiBookings = await response.json();
        console.log('✅ API response:', apiBookings.length, 'bookings');
        
        const ourBooking = apiBookings.find(b => b.userId === 'cmfwmut4v0001tgs0en3il18d');
        if (ourBooking) {
          console.log('✅ Our booking in API:', {
            userId: ourBooking.userId,
            groupSize: ourBooking.groupSize,
            name: ourBooking.name
          });
        }
      } else {
        console.log('❌ API failed:', response.status);
      }
    } catch (fetchError) {
      console.log('❌ API fetch error:', fetchError.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

quickTest();