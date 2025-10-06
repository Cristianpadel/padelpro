// Create time slots for Padel Estrella and book them for Alex
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createClassesAndBookings() {
  try {
    // Get Alex
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (!alex) {
      console.log('❌ Alex not found');
      return;
    }

    console.log('✅ Found Alex García:', alex.id);

    // Get Padel Estrella
    const club = await prisma.club.findFirst({
      where: { id: 'club-padel-estrella' }
    });

    if (!club) {
      console.log('❌ Padel Estrella not found');
      return;
    }

    console.log('✅ Found club:', club.name);

    // Get instructors
    const instructors = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        clubId: club.id
      },
      take: 3
    });

    console.log(`✅ Found ${instructors.length} instructors`);

    // Get court
    const court = await prisma.court.findFirst({
      where: { clubId: club.id }
    });

    if (!court) {
      console.log('❌ No court found');
      return;
    }

    console.log('✅ Found court:', court.number);

    // Create 3 time slots for next week
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const timeSlotsData = [
      {
        date: new Date(tomorrow),
        duration: 90, // minutes
        instructor: instructors[0] || instructors[0]
      },
      {
        date: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000), // +1 day
        duration: 90,
        instructor: instructors[1] || instructors[0]
      },
      {
        date: new Date(tomorrow.getTime() + 2 * 24 * 60 * 60 * 1000), // +2 days
        duration: 90,
        instructor: instructors[2] || instructors[0]
      }
    ];

    console.log('\n📅 Creating time slots...\n');

    const createdSlots = [];

    for (let i = 0; i < timeSlotsData.length; i++) {
      const slotData = timeSlotsData[i];
      const start = slotData.date;
      const end = new Date(start.getTime() + slotData.duration * 60 * 1000);

      const timeSlot = await prisma.timeSlot.create({
        data: {
          clubId: club.id,
          courtId: court.id,
          instructorId: slotData.instructor.id,
          start: start,
          end: end,
          maxPlayers: 4,
          totalPrice: 25,
          level: alex.level,
          category: 'iniciacion',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          instructor: true,
          court: true
        }
      });

      createdSlots.push(timeSlot);

      console.log(`✅ Created time slot ${i + 1}:`);
      console.log(`   📅 ${timeSlot.start.toLocaleString('es-ES')} - ${timeSlot.end.toLocaleString('es-ES')}`);
      console.log(`   👨‍🏫 ${timeSlot.instructor.name}`);
      console.log(`   🎾 Court ${timeSlot.court.number}`);
      console.log(`   💰 ${timeSlot.totalPrice}€`);
      console.log('');
    }

    // Delete old bookings
    await prisma.booking.deleteMany({
      where: { userId: alex.id }
    });

    console.log('🗑️  Deleted old bookings\n');

    // Create bookings for Alex
    const bookingsData = [
      { groupSize: 4, status: 'CONFIRMED' },
      { groupSize: 2, status: 'CONFIRMED' },
      { groupSize: 1, status: 'PENDING' }
    ];

    for (let i = 0; i < createdSlots.length; i++) {
      const slot = createdSlots[i];
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

      console.log(`✅ Created booking ${i + 1}:`);
      console.log(`   ID: ${booking.id}`);
      console.log(`   Status: ${data.status}`);
      console.log(`   Group size: ${data.groupSize}`);
      console.log('');
    }

    // Final summary
    const allBookings = await prisma.booking.findMany({
      where: { userId: alex.id },
      include: {
        timeSlot: {
          include: {
            instructor: true,
            court: true,
            club: true
          }
        }
      }
    });

    console.log(`\n🎉 SUCCESS! Alex García now has ${allBookings.length} bookings:\n`);
    allBookings.forEach((b, i) => {
      console.log(`${i + 1}. [${b.status}] ${b.timeSlot.start.toLocaleString('es-ES')}`);
      console.log(`   🏢 ${b.timeSlot.club.name}`);
      console.log(`   👨‍🏫 ${b.timeSlot.instructor.name}`);
      console.log(`   🎾 Court ${b.timeSlot.court.number}`);
      console.log(`   👥 Group: ${b.groupSize} players`);
      console.log(`   💰 ${b.timeSlot.totalPrice}€`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createClassesAndBookings();
