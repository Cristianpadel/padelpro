const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database content...');
    
    // 1. Verificar TimeSlots
    const timeSlots = await prisma.timeSlot.findMany({
      take: 5,
      orderBy: { start: 'asc' }
    });
    
    console.log(`📊 Total TimeSlots: ${timeSlots.length}`);
    timeSlots.forEach(slot => {
      console.log(`   - ${slot.id}: ${new Date(slot.start).toLocaleString()} (${slot.level})`);
    });
    
    // 2. Verificar usuario
    const user = await prisma.user.findUnique({
      where: { id: 'cmfwmut4v0001tgs0en3il18d' }
    });
    
    if (user) {
      console.log('✅ User found:', user.name, user.email);
    } else {
      console.log('❌ User not found');
    }
    
    // 3. Verificar bookings existentes
    const bookings = await prisma.booking.findMany();
    console.log(`📊 Total Bookings: ${bookings.length}`);
    bookings.forEach(booking => {
      console.log(`   - ${booking.id}: User ${booking.userId} -> Slot ${booking.timeSlotId} (groupSize: ${booking.groupSize})`);
    });
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();