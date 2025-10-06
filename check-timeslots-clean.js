// Verificar timeSlots y sus IDs
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTimeSlots() {
  try {
    console.log('🔍 Verificando TimeSlots existentes...');
    
    const timeSlots = await prisma.timeSlot.findMany({
      select: {
        id: true,
        startTime: true,
        endTime: true,
        date: true,
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: { id: 'asc' }
    });
    
    console.log('📅 TimeSlots encontrados:');
    timeSlots.forEach(slot => {
      console.log(`  ID: ${slot.id} | ${slot.date} ${slot.startTime}-${slot.endTime} | Bookings: ${slot._count.bookings}`);
    });
    
    if (timeSlots.length > 0) {
      const firstSlotId = timeSlots[0].id;
      console.log(`\n🎯 Probando con el primer slot (ID: ${firstSlotId})...`);
      
      // Verificar bookings para el primer slot
      const bookings = await prisma.booking.findMany({
        where: {
          timeSlotId: firstSlotId
        },
        include: {
          user: true
        }
      });
      
      console.log(`📋 Bookings para slot ${firstSlotId}:`, bookings.length);
      bookings.forEach(b => {
        console.log(`  ${b.user.name}: ${b.groupSize}p - ${b.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeSlots();