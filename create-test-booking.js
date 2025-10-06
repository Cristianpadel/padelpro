// create-test-booking.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestBooking() {
  try {
    console.log('🎫 Creando reserva de prueba...');
    
    const userId = 'user-test-masculine-1757970723640';
    const timeSlotId = 'slot-test-1'; // Usar un slot existente
    
    const bookingId = `booking-test-${Date.now()}`;
    
    // Crear reserva de prueba
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO Booking (
        id, userId, timeSlotId, groupSize, status, createdAt, updatedAt
      ) VALUES (
        ${bookingId}, ${userId}, ${timeSlotId}, 1, 'CONFIRMED', datetime('now'), datetime('now')
      )
    `;
    
    console.log('✅ Reserva creada:', bookingId);
    
    // Verificar la reserva con datos del usuario
    const booking = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        b.updatedAt,
        u.name as userName,
        u.level as userLevel,
        u.genderCategory as userGender
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.id = ${bookingId}
    `;
    
    console.log('📋 Reserva verificada:');
    console.log(JSON.stringify(booking[0], null, 2));
    
    // Mostrar todas las reservas para este slot
    console.log('\n📋 Todas las reservas para slot-test-1:');
    const allBookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        u.name as userName,
        u.level as userLevel,
        u.genderCategory as userGender
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = ${timeSlotId}
      AND b.status IN ('PENDING', 'CONFIRMED')
      ORDER BY b.createdAt ASC
    `;
    
    allBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.userName} (${booking.userGender}) - Level: ${booking.userLevel} - Created: ${booking.createdAt}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBooking();