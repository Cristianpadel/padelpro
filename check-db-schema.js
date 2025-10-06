const { PrismaClient } = require('@prisma/client');

async function checkBookingSchema() {
  const prisma = new PrismaClient();
  
  try {
    // Obtener información del esquema de la tabla Booking
    const result = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('📋 ESTRUCTURA DE LA TABLA BOOKING:');
    console.table(result);
    
    // También verificar TimeSlot
    const timeSlotInfo = await prisma.$queryRaw`PRAGMA table_info(TimeSlot)`;
    console.log('\n📋 ESTRUCTURA DE LA TABLA TIMESLOT:');
    console.table(timeSlotInfo);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingSchema();