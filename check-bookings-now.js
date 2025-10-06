const { PrismaClient } = require('@prisma/client');

async function checkBookings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando estado actual de reservas...');
    
    const timeSlotId = 'slot-2025-09-15-court-1-18:00';
    
    // Verificar reservas en BD
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id, b.userId, b.groupSize, b.status, u.name
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = ${timeSlotId}
      ORDER BY b.groupSize, b.status DESC
    `;
    
    console.log('\n📊 Reservas en BD:');
    bookings.forEach(b => {
      console.log(`  ${b.name || 'Sin nombre'}: ${b.groupSize}p - ${b.status}`);
    });
    
    // Probar API directamente
    console.log('\n🌐 Probando API /api/classes/[timeSlotId]/bookings...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();