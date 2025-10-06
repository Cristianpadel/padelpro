// Check time slots structure
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkTimeSlots() {
  try {
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: new Date()
        }
      },
      take: 3,
      include: {
        instructor: true,
        court: true,
        club: true,
        bookings: {
          include: {
            user: true
          }
        }
      }
    });

    console.log(`\n📊 Found ${timeSlots.length} time slots:\n`);
    
    timeSlots.forEach((slot, index) => {
      console.log(`${index + 1}. Time Slot ${slot.id}`);
      console.log(`   📅 Start: ${slot.start.toLocaleString('es-ES')}`);
      console.log(`   📅 End: ${slot.end.toLocaleString('es-ES')}`);
      console.log(`   🏢 Club: ${slot.club?.name || 'N/A'}`);
      console.log(`   🎾 Court: ${slot.court?.number || 'N/A'}`);
      console.log(`   👨‍🏫 Instructor ID: ${slot.instructorId || 'N/A'}`);
      console.log(`   👨‍🏫 Instructor: ${slot.instructor?.name || 'N/A'}`);
      console.log(`   👥 Max Players: ${slot.maxPlayers}`);
      console.log(`   💰 Price: ${slot.totalPrice || 'N/A'}`);
      console.log(`   📝 Bookings: ${slot.bookings.length}`);
      console.log('');
    });

    // Check Alex's bookings
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (alex) {
      const bookings = await prisma.booking.findMany({
        where: { userId: alex.id },
        include: {
          timeSlot: {
            include: {
              instructor: true,
              court: true
            }
          }
        }
      });

      console.log(`\n📋 Alex García's Bookings (${bookings.length}):\n`);
      bookings.forEach((booking, index) => {
        console.log(`${index + 1}. ${booking.status}`);
        console.log(`   ID: ${booking.id}`);
        console.log(`   TimeSlot ID: ${booking.timeSlotId}`);
        console.log(`   📅 ${booking.timeSlot.start.toLocaleString('es-ES')}`);
        console.log(`   👨‍🏫 Instructor: ${booking.timeSlot.instructor?.name || 'No instructor'}`);
        console.log(`   🎾 Court: ${booking.timeSlot.court?.number || 'N/A'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTimeSlots();
