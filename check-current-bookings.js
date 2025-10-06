const { PrismaClient } = require('@prisma/client');

async function checkCurrentBookings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📊 ESTADO ACTUAL DE RESERVAS');
    console.log('============================\n');
    
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.status,
        u.name as userName,
        ts.start as classStart,
        ts.level as classLevel,
        DATE(b.createdAt) as bookingDate,
        TIME(b.createdAt) as bookingTime
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      ORDER BY b.createdAt DESC
    `;
    
    console.log(`✅ TOTAL RESERVAS: ${bookings.length}\n`);
    
    bookings.forEach((booking, index) => {
      const classTime = new Date(booking.classStart).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log(`${index + 1}. ${booking.userName}`);
      console.log(`   🕒 Clase: ${classTime} - ${booking.classLevel}`);
      console.log(`   📋 Estado: ${booking.status}`);
      console.log(`   📅 Reservada: ${booking.bookingDate} ${booking.bookingTime}`);
      console.log('   ---');
    });
    
    // Estadísticas
    const confirmedCount = bookings.filter(b => b.status === 'CONFIRMED').length;
    const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
    
    console.log('\n📈 RESUMEN:');
    console.log(`✅ Confirmadas: ${confirmedCount}`);
    console.log(`⏳ Pendientes: ${pendingCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentBookings();