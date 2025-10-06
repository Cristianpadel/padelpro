const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookingWithExistingClass() {
  try {
    console.log('🔍 Finding existing classes...');
    
    // Obtener las clases existentes
    const timeSlots = await prisma.$queryRaw`
      SELECT id, start, end, level, category, maxPlayers
      FROM TimeSlot
      WHERE start > datetime('now')
      ORDER BY start ASC
      LIMIT 5
    `;
    
    console.log(`📚 Found ${timeSlots.length} future classes`);
    
    if (timeSlots.length > 0) {
      const firstClass = timeSlots[0];
      console.log(`\n� Using class: ${firstClass.id}`);
      console.log(`   Time: ${firstClass.start} - ${firstClass.end}`);
      console.log(`   Level: ${firstClass.level}, Category: ${firstClass.category}`);
      console.log(`   Max players: ${firstClass.maxPlayers}`);
      
      const userId = 'player-alex'; // Alex García
      const timeSlotId = firstClass.id;
      
      console.log('\n🎯 Testing multiple bookings with different group sizes...');
      
      // Inscripción para 1 jugador
      try {
        console.log('📝 Booking for 1 player...');
        const bookingId1 = `booking-${Date.now()}-1player`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${bookingId1}, ${userId}, ${timeSlotId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('✅ Group size 1: Success');
      } catch (error) {
        console.log('❌ Group size 1 error:', error.message);
      }
      
      // Inscripción para 2 jugadores
      try {
        console.log('📝 Booking for 2 players...');
        const bookingId2 = `booking-${Date.now()}-2player`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${bookingId2}, ${userId}, ${timeSlotId}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('✅ Group size 2: Success');
      } catch (error) {
        console.log('❌ Group size 2 error:', error.message);
      }
      
      // Inscripción para 1 jugador más (should fail if unique constraint works)
      try {
        console.log('📝 Trying duplicate booking for 1 player...');
        const bookingId3 = `booking-${Date.now()}-1player-dup`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${bookingId3}, ${userId}, ${timeSlotId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('⚠️ Duplicate booking allowed (this should not happen)');
      } catch (error) {
        console.log('✅ Duplicate booking correctly blocked:', error.message);
      }
      
      // Verificar las reservas creadas
      console.log('\n📊 Checking created bookings...');
      const userBookings = await prisma.$queryRaw`
        SELECT b.id, b.groupSize, b.status, b.createdAt
        FROM Booking b
        WHERE b.userId = ${userId} AND b.timeSlotId = ${timeSlotId}
        ORDER BY b.createdAt DESC
      `;
      
      console.log(`👤 Alex García has ${userBookings.length} bookings for this class:`);
      userBookings.forEach(booking => {
        console.log(`   - ID: ${booking.id}, Group size: ${booking.groupSize}, Status: ${booking.status}`);
      });
      
      // Calcular total de jugadores
      const totalPlayers = await prisma.$queryRaw`
        SELECT SUM(groupSize) as total
        FROM Booking
        WHERE timeSlotId = ${timeSlotId} AND status = 'CONFIRMED'
      `;
      
      const total = totalPlayers[0]?.total || 0;
      console.log(`\n📊 Total players in class: ${total}/${firstClass.maxPlayers}`);
      console.log(`🎯 Class completion: ${((total / firstClass.maxPlayers) * 100).toFixed(1)}%`);
      
    } else {
      console.log('❌ No future classes found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingWithExistingClass();