const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookingWithCorrectID() {
  try {
    // 1. Obtener el primer slot disponible
    const slot = await prisma.timeSlot.findFirst({
      orderBy: { start: 'asc' }
    });
    
    if (!slot) {
      console.log('❌ No slots found');
      return;
    }
    
    console.log('📅 Using slot:', slot.id, new Date(slot.start).toLocaleString());
    
    // 2. Test con groupSize = 4
    const testData = {
      userId: 'cmfwmut4v0001tgs0en3il18d',
      timeSlotId: slot.id,
      groupSize: 4
    };
    
    console.log('📝 Test data:', testData);
    
    // 3. Hacer la llamada
    const response = await fetch('http://localhost:3000/api/classes/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    console.log('📊 Response status:', response.status);
    const responseText = await response.text();
    console.log('📊 Response:', responseText);
    
    // 4. Verificar en base de datos
    const booking = await prisma.booking.findFirst({
      where: {
        userId: testData.userId,
        timeSlotId: testData.timeSlotId
      }
    });
    
    if (booking) {
      console.log('✅ Booking found in DB:', {
        id: booking.id,
        groupSize: booking.groupSize,
        status: booking.status
      });
    } else {
      console.log('❌ Booking NOT found in DB');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingWithCorrectID();