const { PrismaClient } = require('@prisma/client');

async function investigateBookings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 INVESTIGANDO DATOS DE BOOKINGS...');
    
    // Obtener un booking específico con todos los detalles
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id, b.timeSlotId, b.userId, b.groupSize, b.status, b.createdAt,
        u.name, u.profilePictureUrl, u.level, u.gender
      FROM Booking b 
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = 'cmfxhfr1t0006tg5g27smnm1d'
      ORDER BY b.createdAt ASC
    `;
    
    console.log('📋 RAW BOOKING DATA:', bookings);
    console.log('📊 Number of bookings:', bookings.length);
    
    if (bookings.length > 0) {
      const firstBooking = bookings[0];
      console.log('\n📝 FIRST BOOKING DETAILS:');
      console.log('  - ID:', firstBooking.id);
      console.log('  - TimeSlot ID:', firstBooking.timeSlotId);
      console.log('  - User ID:', firstBooking.userId);
      console.log('  - Group Size:', firstBooking.groupSize, '(type:', typeof firstBooking.groupSize, ')');
      console.log('  - Status:', firstBooking.status);
      console.log('  - User Name:', firstBooking.name);
      console.log('  - User Level:', firstBooking.level);
      console.log('  - User Gender:', firstBooking.gender);
      
      // Test lo que espera la tarjeta
      console.log('\n🎯 TESTING FILTERS:');
      console.log('  - groupSize === 1:', firstBooking.groupSize === 1);
      console.log('  - groupSize === 4:', firstBooking.groupSize === 4);
      console.log('  - groupSize == "1":', firstBooking.groupSize == "1");
      console.log('  - groupSize == "4":', firstBooking.groupSize == "4");
    }
    
    // También verificar la estructura de respuesta del API
    console.log('\n🌐 SIMULANDO RESPONSE DEL API:');
    const formattedBookings = bookings.map(booking => ({
      userId: booking.userId,
      groupSize: Number(booking.groupSize), // Asegurar que sea número
      status: booking.status,
      name: booking.name,
      profilePictureUrl: booking.profilePictureUrl,
      userLevel: booking.level,
      userGender: booking.gender,
      createdAt: booking.createdAt
    }));
    
    console.log('📋 Formatted bookings:', JSON.stringify(formattedBookings, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

investigateBookings();