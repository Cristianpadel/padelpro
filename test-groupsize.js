// Verificar que groupSize funciona correctamente
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGroupSize() {
  try {
    console.log('🧪 Probando funcionalidad de groupSize...');
    
    // Verificar estructura de tabla
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('📋 Columnas de Booking:', tableInfo.map(col => col.name));
    
    // Consultar reservas con SQL directo
    const bookingsRaw = await prisma.$queryRaw`SELECT * FROM Booking`;
    console.log('📋 Reservas (SQL directo):', bookingsRaw);
    
    // Crear una reserva de prueba con groupSize = 4
    const testBookingId = `test-booking-${Date.now()}`;
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES (${testBookingId}, 'cmfm2r0ou0003tg2cyyyoxil5', 'open-slot-1', 4, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Reserva de prueba creada con groupSize = 4');
    
    // Verificar la reserva
    const testBooking = await prisma.$queryRaw`SELECT * FROM Booking WHERE id = ${testBookingId}`;
    console.log('🔍 Reserva de prueba:', testBooking);
    
    // Limpiar
    await prisma.$executeRaw`DELETE FROM Booking WHERE id = ${testBookingId}`;
    console.log('🗑️ Reserva de prueba eliminada');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGroupSize();