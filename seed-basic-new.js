// Basic data seeding for new schema
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicData() {
  try {
    console.log('🔄 Creating basic data...');

    // Create club
    const club = await prisma.club.create({
      data: {
        id: 'club-1',
        name: 'Club Padel Pro',
        address: 'Calle Padel 123, Madrid',
        phone: '+34 123 456 789',
        email: 'info@padelproclub.com'
      }
    });
    console.log('✅ Club created');

    // Create courts
    const courts = [];
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          id: `court-${i}`,
          name: `Pista ${i}`,
          clubId: club.id,
          isActive: true
        }
      });
      courts.push(court);
    }
    console.log('✅ Courts created');

    // Create instructor user
    const instructorUser = await prisma.user.create({
      data: {
        id: 'user-instructor-1',
        email: 'carlos@instructor.com',
        name: 'Carlos Instructor',
        role: 'INSTRUCTOR',
        clubId: club.id
      }
    });

    // Create instructor profile
    const instructor = await prisma.instructor.create({
      data: {
        id: 'instructor-1',
        userId: instructorUser.id,
        clubId: club.id,
        experience: '5 años enseñando padel',
        specialties: 'Técnica, estrategia, iniciación'
      }
    });
    console.log('✅ Instructor created');

    // Create test users
    for (let i = 1; i <= 5; i++) {
      await prisma.user.create({
        data: {
          id: `user-${i}`,
          email: `user${i}@test.com`,
          name: `Usuario ${i}`,
          level: 'principiante',
          clubId: club.id
        }
      });
    }
    console.log('✅ Test users created');

    // Create time slots for today and tomorrow
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dates = [
      today.toISOString().split('T')[0],
      tomorrow.toISOString().split('T')[0]
    ];

    const times = [
      { start: '09:00', end: '10:30' },
      { start: '11:00', end: '12:30' },
      { start: '16:00', end: '17:30' },
      { start: '18:00', end: '19:30' }
    ];

    for (const date of dates) {
      for (const court of courts.slice(0, 2)) { // Solo 2 pistas
        for (const time of times) {
          await prisma.timeSlot.create({
            data: {
              id: `slot-${date}-${court.id}-${time.start}`,
              date: date,
              startTime: time.start,
              endTime: time.end,
              courtId: court.id,
              instructorId: instructor.id,
              clubId: club.id,
              maxParticipants: 4,
              price: 25.0,
              classType: 'general',
              level: 'abierto',
              description: `Clase de padel ${time.start}-${time.end}`
            }
          });
        }
      }
    }
    console.log('✅ Time slots created');

    // Create some test bookings with different group sizes
    await prisma.booking.create({
      data: {
        id: 'booking-1',
        userId: 'user-1',
        timeSlotId: `slot-${dates[0]}-court-1-09:00`,
        groupSize: 1,
        status: 'PENDING'
      }
    });

    await prisma.booking.create({
      data: {
        id: 'booking-2',
        userId: 'user-2',
        timeSlotId: `slot-${dates[0]}-court-1-09:00`,
        groupSize: 2,
        status: 'PENDING'
      }
    });

    await prisma.booking.create({
      data: {
        id: 'booking-3',
        userId: 'user-3',
        timeSlotId: `slot-${dates[0]}-court-1-09:00`,
        groupSize: 1,
        status: 'PENDING'
      }
    });

    console.log('✅ Test bookings created');
    console.log('🎉 Basic data creation completed!');

  } catch (error) {
    console.error('❌ Error creating basic data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicData();