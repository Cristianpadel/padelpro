// Create bookings for Alex García
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBookingsForAlex() {
  try {
    // Find Alex García
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (!alex) {
      console.log('❌ Alex García not found in database');
      return;
    }

    console.log('✅ Found Alex García:', alex.id);

    // Find Padel Estrella club
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' }
    });

    if (!club) {
      console.log('❌ Padel Estrella club not found');
      return;
    }

    console.log('✅ Found Padel Estrella:', club.id);

    // Find available time slots (future classes)
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: club.id,
        start: {
          gte: new Date() // Future classes only
        }
      },
      take: 5,
      orderBy: {
        start: 'asc'
      },
      include: {
        instructor: true
      }
    });

    console.log(`\n📅 Found ${timeSlots.length} available time slots`);

    if (timeSlots.length === 0) {
      console.log('❌ No future time slots found');
      return;
    }

    // Create 3 bookings for Alex
    const bookingsToCreate = timeSlots.slice(0, 3);
    
    for (let i = 0; i < bookingsToCreate.length; i++) {
      const slot = bookingsToCreate[i];
      
      // Check if booking already exists
      const existingBooking = await prisma.booking.findFirst({
        where: {
          userId: alex.id,
          timeSlotId: slot.id
        }
      });

      if (existingBooking) {
        console.log(`⏭️  Booking already exists for slot ${slot.id}`);
        continue;
      }

      const booking = await prisma.booking.create({
        data: {
          userId: alex.id,
          timeSlotId: slot.id,
          groupSize: i === 0 ? 4 : (i === 1 ? 2 : 1), // Vary group sizes
          status: i === 0 ? 'CONFIRMED' : 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`✅ Created booking #${i + 1}:`, {
        bookingId: booking.id,
        instructor: slot.instructor?.name,
        date: slot.start.toLocaleString('es-ES'),
        groupSize: booking.groupSize,
        status: booking.status
      });
    }

    // Show summary
    const allBookings = await prisma.booking.findMany({
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

    console.log(`\n📊 Total bookings for Alex García: ${allBookings.length}`);
    allBookings.forEach((booking, index) => {
      console.log(`\n${index + 1}. ${booking.status}`);
      console.log(`   📅 ${booking.timeSlot.start.toLocaleString('es-ES')}`);
      console.log(`   👨‍🏫 ${booking.timeSlot.instructor?.name || 'No instructor'}`);
      console.log(`   🎾 Court ${booking.timeSlot.court?.number || 'N/A'}`);
      console.log(`   👥 Group size: ${booking.groupSize}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBookingsForAlex();
