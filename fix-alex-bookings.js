// Fix bookings - assign to real classes with instructors
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAlexBookings() {
  try {
    // Get Alex
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (!alex) {
      console.log('❌ Alex not found');
      return;
    }

    // Get Padel Estrella instructors
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        clubId: 'club-padel-estrella'
      }
    });

    console.log(`\n👨‍🏫 Found ${instructors.length} instructors in Padel Estrella:`);
    instructors.forEach(i => console.log(`   - ${i.name} (${i.id})`));

    // Get courts
    const courts = await prisma.court.findMany({
      where: { clubId: 'club-padel-estrella' }
    });

    console.log(`\n🎾 Found ${courts.length} courts in Padel Estrella:`);
    courts.forEach(c => console.log(`   - Court ${c.number} (${c.id})`));

    if (instructors.length === 0 || courts.length === 0) {
      console.log('\n❌ Need instructors and courts to create proper bookings');
      return;
    }

    // Delete old bookings
    await prisma.booking.deleteMany({
      where: { userId: alex.id }
    });
    console.log('\n🗑️  Deleted old bookings');

    // Get time slots with proper instructors
    const goodTimeSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-padel-estrella',
        start: {
          gte: new Date()
        },
        instructorId: {
          in: instructors.map(i => i.id)
        },
        courtId: {
          in: courts.map(c => c.id)
        }
      },
      take: 5,
      orderBy: {
        start: 'asc'
      },
      include: {
        instructor: true,
        court: true
      }
    });

    console.log(`\n📅 Found ${goodTimeSlots.length} good time slots`);

    if (goodTimeSlots.length === 0) {
      console.log('❌ No time slots found with instructors and courts');
      return;
    }

    // Create 3 bookings
    const bookingsData = [
      { groupSize: 4, status: 'CONFIRMED' },
      { groupSize: 2, status: 'CONFIRMED' },
      { groupSize: 1, status: 'PENDING' }
    ];

    for (let i = 0; i < Math.min(bookingsData.length, goodTimeSlots.length); i++) {
      const slot = goodTimeSlots[i];
      const data = bookingsData[i];
      
      const booking = await prisma.booking.create({
        data: {
          userId: alex.id,
          timeSlotId: slot.id,
          groupSize: data.groupSize,
          status: data.status,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });

      console.log(`\n✅ Created booking ${i + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   📅 ${slot.start.toLocaleString('es-ES')}`);
      console.log(`   👨‍🏫 ${slot.instructor?.name || 'N/A'}`);
      console.log(`   🎾 Court ${slot.court?.number || 'N/A'}`);
      console.log(`   👥 Group: ${data.groupSize}`);
      console.log(`   ✅ ${data.status}`);
    }

    // Final summary
    const finalBookings = await prisma.booking.findMany({
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

    console.log(`\n\n📊 FINAL SUMMARY - Alex García has ${finalBookings.length} bookings:\n`);
    finalBookings.forEach((b, i) => {
      console.log(`${i + 1}. [${b.status}] ${b.timeSlot.start.toLocaleString('es-ES')}`);
      console.log(`   👨‍🏫 ${b.timeSlot.instructor?.name || 'No instructor'}`);
      console.log(`   🎾 Court ${b.timeSlot.court?.number || 'N/A'}`);
      console.log(`   👥 Group size: ${b.groupSize}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAlexBookings();
