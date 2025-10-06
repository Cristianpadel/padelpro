// Test para verificar inscripciones múltiples en diferentes modalidades
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testMultipleBookings() {
  console.log('🧪 === TEST INSCRIPCIONES MÚLTIPLES ===');
  
  const userId = 'cmfm2r0ou0003tg2cyyyoxil5'; // Carlos López
  const timeSlotId = 'open-slot-1';
  
  try {
    // 1. Verificar reservas actuales
    console.log('\n1. Verificando reservas actuales...');
    const currentBookings = await prisma.$queryRaw`
      SELECT * FROM Booking 
      WHERE userId = ${userId} AND timeSlotId = ${timeSlotId}
      ORDER BY groupSize
    `;
    console.log('📋 Reservas actuales:', currentBookings);
    
    // 2. Simular inscripciones para diferentes modalidades
    const modalidades = [1, 2, 3, 4];
    
    for (const groupSize of modalidades) {
      console.log(`\n2.${groupSize} Probando inscripción para ${groupSize} jugador${groupSize > 1 ? 'es' : ''}...`);
      
      // Verificar si ya existe
      const existing = await prisma.$queryRaw`
        SELECT id FROM Booking 
        WHERE userId = ${userId} 
        AND timeSlotId = ${timeSlotId} 
        AND groupSize = ${groupSize}
        AND status IN ('PENDING', 'CONFIRMED')
      `;
      
      if (existing && existing.length > 0) {
        console.log(`   ⚠️ Ya existe reserva para ${groupSize} jugador${groupSize > 1 ? 'es' : ''}`);
      } else {
        console.log(`   ✅ Modalidad de ${groupSize} jugador${groupSize > 1 ? 'es' : ''} disponible`);
        
        // Crear reserva de prueba
        const testBookingId = `test-multi-${Date.now()}-${groupSize}`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${testBookingId}, ${userId}, ${timeSlotId}, ${groupSize}, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log(`   📝 Reserva de prueba creada: ${testBookingId}`);
      }
    }
    
    // 3. Verificar todas las reservas creadas
    console.log('\n3. Verificando todas las reservas después de las pruebas...');
    const allBookings = await prisma.$queryRaw`
      SELECT * FROM Booking 
      WHERE userId = ${userId} AND timeSlotId = ${timeSlotId}
      ORDER BY groupSize
    `;
    console.log('📋 Todas las reservas:', allBookings);
    
    // 4. Limpiar reservas de prueba
    console.log('\n4. Limpiando reservas de prueba...');
    await prisma.$executeRaw`
      DELETE FROM Booking 
      WHERE userId = ${userId} 
      AND timeSlotId = ${timeSlotId} 
      AND id LIKE 'test-multi-%'
    `;
    console.log('✅ Reservas de prueba eliminadas');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
    console.log('\n🎉 === TEST COMPLETADO ===');
  }
}

testMultipleBookings();