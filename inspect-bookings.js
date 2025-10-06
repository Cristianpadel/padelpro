const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function inspectBookingsSQL() {
  try {
    console.log('🔍 Inspecting bookings with direct SQL...');
    
    // 1. Verificar estructura de tabla
    const tableInfo = await prisma.$queryRaw`
      PRAGMA table_info(Booking)
    `;
    
    console.log('📊 Booking table structure:');
    tableInfo.forEach(col => {
      console.log(`   - ${col.name}: ${col.type} (default: ${col.dflt_value})`);
    });
    
    // 2. Consultar todos los bookings de Alex con SQL directo
    const bookings = await prisma.$queryRaw`
      SELECT 
        id, 
        userId, 
        timeSlotId, 
        groupSize, 
        status, 
        createdAt, 
        updatedAt
      FROM Booking 
      WHERE userId = 'cmfwmut4v0001tgs0en3il18d'
      ORDER BY createdAt DESC
    `;
    
    console.log(`\n📋 Found ${bookings.length} bookings for Alex García:`);
    bookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. Booking: ${booking.id}`);
      console.log(`   - TimeSlot: ${booking.timeSlotId}`);
      console.log(`   - GroupSize: ${booking.groupSize} (type: ${typeof booking.groupSize})`);
      console.log(`   - Status: ${booking.status}`);
      console.log(`   - Created: ${booking.createdAt}`);
    });
    
    // 3. Verificar si es problema de conversión de tipos
    const rawBookings = await prisma.$queryRaw`
      SELECT * FROM Booking WHERE userId = 'cmfwmut4v0001tgs0en3il18d'
    `;
    
    console.log('\n🔍 Raw booking data:');
    rawBookings.forEach(booking => {
      console.log('Raw booking:', Object.keys(booking).map(key => 
        `${key}: ${booking[key]} (${typeof booking[key]})`
      ).join(', '));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

inspectBookingsSQL();