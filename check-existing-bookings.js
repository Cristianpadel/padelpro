// Script para verificar las reservas existentes y sus groupSize
const { PrismaClient } = require('@prisma/client');

async function checkExistingBookings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando reservas existentes...');
    
    const bookings = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        u.name as userName
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.status IN ('PENDING', 'CONFIRMED')
      ORDER BY b.timeSlotId, b.createdAt
    `;
    
    console.log('\n📋 Reservas encontradas:');
    console.table(bookings.map(b => ({
      id: b.id.substring(0, 20) + '...',
      userName: b.userName,
      timeSlotId: b.timeSlotId.substring(0, 20) + '...',
      groupSize: b.groupSize,
      status: b.status
    })));
    
    // Agrupar por timeSlotId
    const groupedBySlot = {};
    bookings.forEach(booking => {
      if (!groupedBySlot[booking.timeSlotId]) {
        groupedBySlot[booking.timeSlotId] = [];
      }
      groupedBySlot[booking.timeSlotId].push(booking);
    });
    
    console.log('\n📊 Reservas agrupadas por clase:');
    Object.entries(groupedBySlot).forEach(([slotId, bookings]) => {
      console.log(`\n🎯 Clase: ${slotId.substring(0, 20)}...`);
      bookings.forEach(booking => {
        console.log(`  - ${booking.userName}: groupSize=${booking.groupSize}, status=${booking.status}`);
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkExistingBookings();