const { PrismaClient } = require('@prisma/client');

async function checkBookingStorage() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 SISTEMA DE ALMACENAMIENTO DE RESERVAS');
    console.log('=====================================\n');
    
    // 1. Verificar todas las reservas
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.status,
        b.createdAt,
        u.name as userName,
        u.email as userEmail,
        ts.start as classStart,
        ts.level as classLevel,
        ts.totalPrice as classPrice
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
      ORDER BY b.createdAt DESC
    `;
    
    console.log('📋 TODAS LAS RESERVAS EN LA BASE DE DATOS:');
    console.log(`Total de reservas: ${bookings.length}\n`);
    
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. ID Reserva: ${booking.id}`);
      console.log(`   Usuario: ${booking.userName} (${booking.userEmail})`);
      console.log(`   Estado: ${booking.status}`);
      console.log(`   Clase: ${new Date(booking.classStart).toLocaleString()}`);
      console.log(`   Nivel: ${booking.classLevel}`);
      console.log(`   Precio: ${booking.classPrice}€`);
      console.log(`   Creada: ${new Date(booking.createdAt).toLocaleString()}`);
      console.log('   ---');
    });
    
    // 2. Estadísticas por estado
    const stats = await prisma.$queryRaw`
      SELECT 
        status,
        COUNT(*) as count
      FROM Booking
      GROUP BY status
    `;
    
    console.log('\n📊 ESTADÍSTICAS POR ESTADO:');
    stats.forEach(stat => {
      console.log(`${stat.status}: ${stat.count} reservas`);
    });
    
    // 3. Información de la base de datos
    console.log('\n🗄️ INFORMACIÓN DE LA BASE DE DATOS:');
    console.log('Archivo: prisma/prisma/dev.db (SQLite)');
    console.log('ORM: Prisma');
    console.log('Tablas principales: User, TimeSlot, Booking, Instructor, Court, Club');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingStorage();