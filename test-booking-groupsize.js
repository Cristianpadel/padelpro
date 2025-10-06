const { PrismaClient } = require('@prisma/client');

async function createBookingWithGroupSize() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Creando reserva con groupSize...');
    
    // Crear usuario si no existe
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO User (id, email, name, profilePictureUrl) 
      VALUES ('user-maria-test', 'maria@test.com', 'María López', 'https://avatar.vercel.sh/maria.png?size=60')
    `;
    
    // Crear reserva con groupSize
    const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES (${bookingId}, 'user-maria-test', 'class-2025-09-14-14-inst-1', 2, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Reserva creada con groupSize 2');
    
    // Verificar
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true
      }
    });
    
    console.log('📋 Reserva verificada:', {
      id: booking.id,
      userId: booking.userId,
      groupSize: booking.groupSize,
      userName: booking.user.name
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBookingWithGroupSize();