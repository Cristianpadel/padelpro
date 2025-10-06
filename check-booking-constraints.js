// Revisar estructura y constraints de la tabla Booking
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBookingConstraints() {
  try {
    console.log('🔍 Revisando estructura de la tabla Booking...');
    
    // Ver índices
    const indexes = await prisma.$queryRaw`PRAGMA index_list(Booking)`;
    console.log('📋 Índices:', indexes);
    
    // Ver schema de la tabla
    const schema = await prisma.$queryRaw`SELECT sql FROM sqlite_master WHERE type='table' AND name='Booking'`;
    console.log('📋 Schema de Booking:', schema);
    
    // Ver información de tabla
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('📋 Columnas:', tableInfo);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingConstraints();