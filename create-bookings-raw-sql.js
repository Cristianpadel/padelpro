const { PrismaClient } = require('@prisma/client');

async function createBookingsWithRawSQL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Creando reservas usando SQL directo...');
    
    // Verificar estructura de la tabla
    const structure = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    const hasGroupSize = structure.some(col => col.name === 'groupSize');
    console.log('🔍 Tabla Booking tiene groupSize:', hasGroupSize);
    
    if (!hasGroupSize) {
      console.log('❌ La columna groupSize no existe. Saliendo...');
      return;
    }
    
    // Limpiar reservas existentes
    await prisma.$executeRaw`DELETE FROM Booking`;
    console.log('🧹 Reservas existentes eliminadas');
    
    // Obtener IDs de clases y usuarios
    const timeSlots = await prisma.$queryRaw`
      SELECT id, start FROM TimeSlot 
      ORDER BY start ASC
    `;
    
    const users = await prisma.$queryRaw`
      SELECT id, name FROM User 
      WHERE id IN ('cmfwmut4v0001tgs0en3il18d', 'cmfxhfr3a000ktg5gpwmo7xr8')
    `;
    
    console.log('✅ TimeSlots encontrados:', timeSlots.length);
    console.log('✅ Usuarios encontrados:', users.length);
    
    if (timeSlots.length === 0 || users.length === 0) {
      console.log('❌ No hay datos suficientes');
      return;
    }
    
    const testUser = users.find(u => u.id === 'cmfwmut4v0001tgs0en3il18d');
    const user2 = users.find(u => u.id === 'cmfxhfr3a000ktg5gpwmo7xr8');
    
    // Crear reservas usando SQL directo
    const bookingId1 = `booking-${Date.now()}-1`;
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES (${bookingId1}, ${testUser.id}, ${timeSlots[0].id}, 4, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    console.log('✅ Reserva 1: 4 jugadores - CONFIRMADA');
    
    if (timeSlots[1]) {
      const bookingId2 = `booking-${Date.now()}-2`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId2}, ${testUser.id}, ${timeSlots[1].id}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
      `;
      console.log('✅ Reserva 2: 2 jugadores - CONFIRMADA');
    }
    
    if (timeSlots[2] && user2) {
      const bookingId3 = `booking-${Date.now()}-3`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId3}, ${user2.id}, ${timeSlots[2].id}, 1, 'PENDING', datetime('now'), datetime('now'))
      `;
      console.log('✅ Reserva 3: 1 jugador - PENDIENTE');
    }
    
    if (timeSlots[3]) {
      const bookingId4 = `booking-${Date.now()}-4`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId4}, ${testUser.id}, ${timeSlots[3].id}, 3, 'CONFIRMED', datetime('now'), datetime('now'))
      `;
      console.log('✅ Reserva 4: 3 jugadores - CONFIRMADA');
    }
    
    // Una reserva adicional en la primera clase
    if (timeSlots[0] && user2) {
      const bookingId5 = `booking-${Date.now()}-5`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId5}, ${user2.id}, ${timeSlots[0].id}, 2, 'PENDING', datetime('now'), datetime('now'))
      `;
      console.log('✅ Reserva 5: 2 jugadores - PENDIENTE');
    }
    
    // Verificar que se crearon
    const bookingCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Booking`;
    console.log('📊 Total reservas creadas:', bookingCount[0].count);
    
    // Mostrar resumen detallado
    const allBookings = await prisma.$queryRaw`
      SELECT 
        b.id, b.groupSize, b.status,
        u.name as userName,
        ts.start as classTime
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      ORDER BY ts.start
    `;
    
    console.log('\n🔍 Resumen de reservas creadas:');
    allBookings.forEach((booking, index) => {
      const timeStr = new Date(booking.classTime).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`📋 ${index + 1}. ${booking.userName} - ${booking.groupSize} jugadores - ${timeStr} - ${booking.status}`);
    });
    
    console.log('\n🎉 ¡RESERVAS CREADAS EXITOSAMENTE!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBookingsWithRawSQL();