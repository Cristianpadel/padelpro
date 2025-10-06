const { PrismaClient } = require('@prisma/client');

async function createBookingsForToday() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Creando reservas para las clases de hoy...');
    
    // Obtener clases de hoy
    const today = new Date('2025-09-14');
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    const todayClasses = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: startOfDay,
          lt: endOfDay
        }
      }
    });
    
    console.log('🎯 Clases encontradas para hoy:', todayClasses.length);
    
    // Crear reservas para las primeras 3 clases
    const classesToBook = todayClasses.slice(0, 3);
    
    for (const timeSlot of classesToBook) {
      try {
        // Verificar si ya existe una reserva
        const existingBooking = await prisma.booking.findFirst({
          where: {
            userId: 'user-alex-test',
            timeSlotId: timeSlot.id
          }
        });
        
        if (existingBooking) {
          console.log('⏭️ Ya existe reserva para:', timeSlot.id);
          continue;
        }
        
        // Crear reserva
        const bookingId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, status, createdAt, updatedAt)
          VALUES (${bookingId}, 'user-alex-test', ${timeSlot.id}, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        
        console.log('✅ Reserva creada para clase:', timeSlot.id, 'a las', timeSlot.start.toLocaleTimeString());
        
      } catch (error) {
        console.error('❌ Error creando reserva para', timeSlot.id, ':', error.message);
      }
    }
    
    console.log('🏁 Proceso completado');
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBookingsForToday();