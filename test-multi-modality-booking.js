// test-multi-modality-booking.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMultiModalityBooking() {
  try {
    console.log('🧪 Testing Multi-Modality Booking System');
    console.log('=====================================');

    // Obtener una clase disponible
    const timeSlots = await prisma.timeSlot.findMany({
      take: 1,
      include: {
        bookings: true
      }
    });

    if (timeSlots.length === 0) {
      console.log('❌ No time slots found');
      return;
    }

    const timeSlot = timeSlots[0];
    console.log(`\n📋 Testing with TimeSlot: ${timeSlot.id}`);
    console.log(`📅 Date: ${timeSlot.start}`);
    console.log(`👨‍🏫 Instructor: ${timeSlot.instructorId}`);

    // Usuario de prueba
    const userId = 'cmfwmut4v0001tgs0en3il18d'; // Alex García

    console.log(`\n👤 User ID: ${userId}`);

    // Limpiar reservas existentes para esta prueba
    await prisma.booking.deleteMany({
      where: {
        userId: userId,
        timeSlotId: timeSlot.id
      }
    });

    console.log(`🧹 Cleaned existing bookings for user`);

    // Test 1: Reservar para 1 jugador
    console.log(`\n🎯 Test 1: Booking for 1 player`);
    try {
      const booking1 = await prisma.booking.create({
        data: {
          id: `booking-test-1-${Date.now()}`,
          userId: userId,
          timeSlotId: timeSlot.id,
          groupSize: 1,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ Booking for 1 player created: ${booking1.id}`);
    } catch (error) {
      console.log(`❌ Error booking for 1 player:`, error.message);
    }

    // Test 2: Reservar para 2 jugadores (mismo usuario, diferente modalidad)
    console.log(`\n🎯 Test 2: Booking for 2 players (same user, different modality)`);
    try {
      const booking2 = await prisma.booking.create({
        data: {
          id: `booking-test-2-${Date.now()}`,
          userId: userId,
          timeSlotId: timeSlot.id,
          groupSize: 2,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ Booking for 2 players created: ${booking2.id}`);
    } catch (error) {
      console.log(`❌ Error booking for 2 players:`, error.message);
    }

    // Test 3: Reservar para 3 jugadores (mismo usuario, diferente modalidad)
    console.log(`\n🎯 Test 3: Booking for 3 players (same user, different modality)`);
    try {
      const booking3 = await prisma.booking.create({
        data: {
          id: `booking-test-3-${Date.now()}`,
          userId: userId,
          timeSlotId: timeSlot.id,
          groupSize: 3,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ Booking for 3 players created: ${booking3.id}`);
    } catch (error) {
      console.log(`❌ Error booking for 3 players:`, error.message);
    }

    // Test 4: Reservar para 4 jugadores (mismo usuario, diferente modalidad)
    console.log(`\n🎯 Test 4: Booking for 4 players (same user, different modality)`);
    try {
      const booking4 = await prisma.booking.create({
        data: {
          id: `booking-test-4-${Date.now()}`,
          userId: userId,
          timeSlotId: timeSlot.id,
          groupSize: 4,
          status: 'CONFIRMED'
        }
      });
      console.log(`✅ Booking for 4 players created: ${booking4.id}`);
    } catch (error) {
      console.log(`❌ Error booking for 4 players:`, error.message);
    }

    // Test 5: Intentar reservar duplicado para 2 jugadores (debería fallar)
    console.log(`\n🎯 Test 5: Attempt duplicate booking for 2 players (should fail)`);
    try {
      const bookingDuplicate = await prisma.booking.create({
        data: {
          id: `booking-test-duplicate-${Date.now()}`,
          userId: userId,
          timeSlotId: timeSlot.id,
          groupSize: 2,
          status: 'CONFIRMED'
        }
      });
      console.log(`❌ UNEXPECTED: Duplicate booking was allowed: ${bookingDuplicate.id}`);
    } catch (error) {
      console.log(`✅ EXPECTED: Duplicate booking prevented: ${error.message}`);
    }

    // Verificar reservas finales
    console.log(`\n📊 Final Bookings Summary:`);
    const finalBookings = await prisma.booking.findMany({
      where: {
        userId: userId,
        timeSlotId: timeSlot.id,
        status: 'CONFIRMED'
      },
      orderBy: {
        groupSize: 'asc'
      }
    });

    finalBookings.forEach(booking => {
      console.log(`📋 ${booking.groupSize} players - ${booking.id}`);
    });

    console.log(`\n✅ Total bookings for user: ${finalBookings.length}`);
    console.log(`🎯 Expected: 4 bookings (one per modality)`);
    console.log(`🏆 Test Result: ${finalBookings.length === 4 ? 'SUCCESS' : 'FAILURE'}`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar test
testMultiModalityBooking();