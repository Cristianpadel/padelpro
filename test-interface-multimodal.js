// Test sistema multi-modal en interfaz
const { PrismaClient } = require('@prisma/client');

async function testInterfaceMultiModal() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🎨 Preparando datos para prueba de interfaz multi-modal');
    
    const timeSlotId = 'slot-2025-09-15-court-1-18:00';
    
    // Limpiar reservas existentes para esta clase
    await prisma.$executeRaw`DELETE FROM Booking WHERE timeSlotId = ${timeSlotId}`;
    
    console.log('🧹 Limpiado slot:', timeSlotId);
    
    // Escenario de prueba realista:
    console.log('\n📝 Creando escenario de prueba:');
    
    // 1. Usuario 1 se inscribe en modalidad 1p (PENDING)
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('test-booking-1', 'user-1', ${timeSlotId}, 1, 'PENDING', datetime('now'), datetime('now'))
    `;
    console.log('✅ Usuario 1 → modalidad 1p (PENDING)');
    
    // 2. Usuario 1 también se inscribe en modalidad 2p (PENDING)
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('test-booking-2', 'user-1', ${timeSlotId}, 2, 'PENDING', datetime('now'), datetime('now'))
    `;
    console.log('✅ Usuario 1 → modalidad 2p (PENDING)');
    
    // 3. Usuario 2 se inscribe en modalidad 2p (COMPLETA LA MODALIDAD!)
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('test-booking-3', 'user-2', ${timeSlotId}, 2, 'PENDING', datetime('now'), datetime('now'))
    `;
    console.log('✅ Usuario 2 → modalidad 2p (PENDING)');
    
    // Aplicar lógica de confirmación automática
    console.log('\n🔄 Aplicando lógica de confirmación automática...');
    
    // Confirmar modalidad 2p
    await prisma.$executeRaw`
      UPDATE Booking 
      SET status = 'CONFIRMED', updatedAt = datetime('now')
      WHERE timeSlotId = ${timeSlotId} 
      AND groupSize = 2
      AND status = 'PENDING'
    `;
    
    // Cancelar otras inscripciones de usuarios confirmados
    await prisma.$executeRaw`
      UPDATE Booking 
      SET status = 'CANCELLED', updatedAt = datetime('now')
      WHERE timeSlotId = ${timeSlotId} 
      AND userId IN (
        SELECT DISTINCT userId FROM Booking 
        WHERE timeSlotId = ${timeSlotId} 
        AND groupSize = 2 
        AND status = 'CONFIRMED'
      )
      AND groupSize != 2
      AND status = 'PENDING'
    `;
    
    // 4. Usuario 3 se inscribe en modalidad 1p (PENDING)
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('test-booking-4', 'user-3', ${timeSlotId}, 1, 'PENDING', datetime('now'), datetime('now'))
    `;
    console.log('✅ Usuario 3 → modalidad 1p (PENDING)');
    
    // 5. Usuario 4 se inscribe en modalidad 3p (PENDING)
    await prisma.$executeRaw`
      INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('test-booking-5', 'user-4', ${timeSlotId}, 3, 'PENDING', datetime('now'), datetime('now'))
    `;
    console.log('✅ Usuario 4 → modalidad 3p (PENDING)');
    
    console.log('\n📊 Estado final de reservas:');
    const finalBookings = await prisma.$queryRaw`
      SELECT 
        b.userId, b.groupSize, b.status, u.name
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = ${timeSlotId}
      ORDER BY b.groupSize, b.status DESC, b.createdAt
    `;
    
    finalBookings.forEach(b => {
      console.log(`  ${b.name}: ${b.groupSize}p - ${b.status}`);
    });
    
    console.log('\n🎯 Ahora ve al navegador para ver el sistema multi-modal en acción!');
    console.log(`📍 URL: http://localhost:9002/activities?view=clases&date=2025-09-15`);
    console.log(`🔍 Busca la clase de las 18:00 en Pista 1`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testInterfaceMultiModal();