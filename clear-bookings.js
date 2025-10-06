const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearBookings() {
  try {
    console.log('🧹 Clearing existing bookings...');
    
    const deleted = await prisma.booking.deleteMany({});
    console.log(`✅ Deleted ${deleted.count} bookings`);
    
    // Verificar que se limpiaron
    const remaining = await prisma.booking.count();
    console.log(`📊 Remaining bookings: ${remaining}`);
    
  } catch (error) {
    console.error('❌ Error clearing bookings:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearBookings();