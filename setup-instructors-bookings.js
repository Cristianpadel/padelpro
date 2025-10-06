// Check instructors and create Instructor records if needed
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupInstructorsAndBookings() {
  try {
    // Get instructor users
    const instructorUsers = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        clubId: 'club-padel-estrella'
      }
    });

    console.log(`\n👨‍🏫 Found ${instructorUsers.length} instructor USERS\n`);

    // Check if they have Instructor profiles
    const instructorProfiles = await prisma.instructor.findMany({
      where: {
        userId: {
          in: instructorUsers.map(u => u.id)
        }
      }
    });

    console.log(`📋 Found ${instructorProfiles.length} INSTRUCTOR profiles\n`);

    // Create missing instructor profiles
    for (const user of instructorUsers) {
      const existingProfile = instructorProfiles.find(p => p.userId === user.id);
      
      if (!existingProfile) {
        const newInstructor = await prisma.instructor.create({
          data: {
            userId: user.id,
            name: user.name,
            clubId: user.clubId,
            profilePictureUrl: user.profilePictureUrl,
            hourlyRate: 25,
            specialties: 'Padel',
            experience: '5 años',
            isActive: true
          }
        });

        console.log(`✅ Created Instructor profile for ${user.name} (${newInstructor.id})`);
      } else {
        console.log(`⏭️  Instructor profile already exists for ${user.name}`);
      }
    }

    // Get all instructor profiles now
    const allInstructors = await prisma.instructor.findMany({
      where: { clubId: 'club-padel-estrella' },
      include: { user: true }
    });

    console.log(`\n✅ Total instructor profiles: ${allInstructors.length}\n`);

    // Get court
    const court = await prisma.court.findFirst({
      where: { clubId: 'club-padel-estrella' }
    });

    if (!court) {
      console.log('❌ No court found');
      return;
    }

    console.log(`✅ Found court: ${court.number}\n`);

    // Get Alex
    const alex = await prisma.user.findFirst({
      where: { email: 'alex.garcia@email.com' }
    });

    if (!alex) {
      console.log('❌ Alex not found');
      return;
    }

    console.log(`✅ Found Alex García: ${alex.id}\n`);

    // Delete old bookings
    await prisma.booking.deleteMany({
      where: { userId: alex.id }
    });
    console.log('🗑️  Deleted old bookings\n');

    // Create 3 time slots for tomorrow onwards
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);

    const createdSlots = [];

    for (let i = 0; i < 3; i++) {
      const instructor = allInstructors[i % allInstructors.length];
      const slotDate = new Date(tomorrow.getTime() + i * 24 * 60 * 60 * 1000);
      const endDate = new Date(slotDate.getTime() + 90 * 60 * 1000);

      const timeSlot = await prisma.timeSlot.create({
        data: {
          clubId: 'club-padel-estrella',
          courtId: court.id,
          instructorId: instructor.id, // Use Instructor.id, not User.id
          start: slotDate,
          end: endDate,
          maxPlayers: 4,
          totalPrice: 25,
          level: alex.level,
          category: 'iniciacion',
        },
        include: {
          instructor: {
            include: {
              user: true
            }
          },
          court: true
        }
      });

      createdSlots.push(timeSlot);

      console.log(`✅ Created time slot ${i + 1}:`);
      console.log(`   📅 ${timeSlot.start.toLocaleString('es-ES')}`);
      console.log(`   👨‍🏫 ${timeSlot.instructor.name}`);
      console.log(`   🎾 Court ${timeSlot.court.number}\n`);
    }

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
        }
      });

      console.log(`✅ Created booking ${i + 1}: [${data.status}] Group of ${data.groupSize}`);
    }

    // Final summary
    const allBookings = await prisma.booking.findMany({
      where: { userId: alex.id },
      include: {
        timeSlot: {
          include: {
            instructor: {
              include: { user: true }
            },
            court: true,
            club: true
          }
        }
      }
    });

    console.log(`\n\n🎉 SUCCESS! Alex García now has ${allBookings.length} bookings:\n`);
    allBookings.forEach((b, i) => {
      console.log(`${i + 1}. [${b.status}] ${b.timeSlot.start.toLocaleString('es-ES')}`);
      console.log(`   🏢 ${b.timeSlot.club.name}`);
      console.log(`   👨‍🏫 ${b.timeSlot.instructor.name}`);
      console.log(`   🎾 Court ${b.timeSlot.court.number}`);
      console.log(`   👥 Group: ${b.groupSize}`);
      console.log(`   💰 ${b.timeSlot.totalPrice}€\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupInstructorsAndBookings();
