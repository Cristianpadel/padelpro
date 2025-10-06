// Crear reservas de prueba para probar el nuevo sistema de "Mis Reservas"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestBookingsForMyReservations() {
  try {
    console.log('🧪 Creando reservas de prueba para "Mis Reservas"...');
    
    const userId = 'cmfm2r0ou0003tg2cyyyoxil5'; // Carlos López
    const timeSlotId = 'open-slot-1';
    
    // 1. Crear varias reservas para completar la clase
    console.log('📝 Creando múltiples reservas para completar la clase...');
    
    // Crear reservas adicionales del instructor para completar la clase
    const instructorUserId = 'instructor-user-1';
    
    for (let i = 1; i <= 2; i++) {
      const bookingId = `test-complete-${Date.now()}-${i}`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId}, ${instructorUserId}, ${timeSlotId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
      `;
      console.log(`✅ Reserva ${i} creada para completar la clase`);
    }
    
    // 2. Verificar el estado de la clase
    console.log('\n🔍 Verificando estado de la clase...');
    const classStatus = await prisma.$queryRaw`
      SELECT 
        ts.id,
        ts.maxPlayers,
        COUNT(b.id) as totalBookings
      FROM TimeSlot ts
      LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status IN ('PENDING', 'CONFIRMED')
      WHERE ts.id = ${timeSlotId}
      GROUP BY ts.id
    `;
    
    console.log('📊 Estado de la clase:', classStatus);
    
    // 3. Probar el endpoint de "Mis Reservas"
    console.log('\n🧪 Probando endpoint de "Mis Reservas"...');
    const myBookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        b.updatedAt,
        ts.id as timeSlot_id,
        ts.maxPlayers as timeSlot_maxPlayers,
        ts.start as timeSlot_start,
        ts.end as timeSlot_end,
        ts.totalPrice as timeSlot_totalPrice,
        ts.level as timeSlot_level,
        ts.category as timeSlot_category,
        (SELECT COUNT(*) FROM Booking b2 
         WHERE b2.timeSlotId = ts.id 
         AND b2.status IN ('PENDING', 'CONFIRMED')) as total_bookings
      FROM Booking b
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      WHERE b.userId = ${userId}
      AND b.status = 'CONFIRMED'
      AND (
        (SELECT COUNT(*) FROM Booking b2 
         WHERE b2.timeSlotId = ts.id 
         AND b2.status IN ('PENDING', 'CONFIRMED')) >= ts.maxPlayers
        OR 
        ts.start < datetime('now')
      )
      ORDER BY ts.start DESC
    `;
    
    console.log('📋 Mis reservas que aparecerán:', myBookings);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestBookingsForMyReservations();