const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugBookingCreation() {
  try {
    console.log('🔍 Verificando la estructura de la tabla Booking...');
    
    // Ver la estructura de la tabla
    const schema = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('📊 Esquema de la tabla Booking:');
    console.table(schema);
    
    // Ver todos los bookings directos de la BD
    const bookings = await prisma.$queryRaw`SELECT * FROM Booking`;
    console.log('\n📋 Bookings en la base de datos:');
    console.table(bookings);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBookingCreation();