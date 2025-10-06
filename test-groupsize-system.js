const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAndTestBookingSystem() {
  try {
    console.log('🔍 Checking existing database structure...');
    
    // Verificar clubs existentes
    const clubs = await prisma.$queryRaw`SELECT id, name FROM Club LIMIT 3`;
    console.log(`🏢 Found ${clubs.length} clubs`);
    
    // Verificar courts existentes
    const courts = await prisma.$queryRaw`SELECT id, number, clubId FROM Court LIMIT 3`;
    console.log(`🏟️ Found ${courts.length} courts`);
    
    // Verificar instructors existentes
    const instructors = await prisma.$queryRaw`SELECT id, name FROM Instructor LIMIT 3`;
    console.log(`👨‍🏫 Found ${instructors.length} instructors`);
    
    // Verificar users existentes (especialmente Alex García)
    const users = await prisma.$queryRaw`
      SELECT id, name, email FROM User 
      WHERE id IN ('player-alex', 'player-lucia', 'cmftpzw3g0001tguwgauzlxkz')
    `;
    console.log(`👤 Found ${users.length} relevant users:`);
    users.forEach(user => {
      console.log(`   - ${user.name} (${user.id})`);
    });
    
    if (clubs.length > 0 && courts.length > 0 && instructors.length > 0 && users.length > 0) {
      // Crear una clase de prueba para mañana
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0); // 7 PM
      
      const classEnd = new Date(tomorrow);
      classEnd.setHours(20, 30, 0, 0); // 8:30 PM
      
      const testClassId = `test-groupsize-${Date.now()}`;
      
      console.log('\n🏗️ Creating test class...');
      await prisma.$executeRaw`
        INSERT INTO TimeSlot (
          id, clubId, courtId, instructorId, start, end, 
          maxPlayers, totalPrice, level, category, createdAt, updatedAt
        )
        VALUES (
          ${testClassId}, 
          ${clubs[0].id}, 
          ${courts[0].id}, 
          ${instructors[0].id}, 
          ${tomorrow.toISOString()}, 
          ${classEnd.toISOString()}, 
          4, 
          25.0, 
          'intermedio', 
          'class', 
          datetime('now'), 
          datetime('now')
        )
      `;
      console.log(`✅ Created class: ${testClassId.substring(0, 25)}...`);
      
      // Probar múltiples reservas con diferentes groupSize
      const testUser = users[0];
      console.log(`\n🎯 Testing multiple bookings for: ${testUser.name}`);
      
      // Reserva 1: 1 jugador
      try {
        const booking1Id = `booking-test-1-${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${booking1Id}, ${testUser.id}, ${testClassId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('✅ Booking for 1 player: SUCCESS');
      } catch (error) {
        console.log('❌ Booking for 1 player:', error.message);
      }
      
      // Reserva 2: 2 jugadores (mismo usuario, diferente groupSize)
      try {
        const booking2Id = `booking-test-2-${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${booking2Id}, ${testUser.id}, ${testClassId}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('✅ Booking for 2 players: SUCCESS');
      } catch (error) {
        console.log('❌ Booking for 2 players:', error.message);
      }
      
      // Reserva 3: Intentar duplicar 1 jugador (debería fallar)
      try {
        const booking3Id = `booking-test-dup-${Date.now()}`;
        await prisma.$executeRaw`
          INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
          VALUES (${booking3Id}, ${testUser.id}, ${testClassId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
        `;
        console.log('⚠️ Duplicate booking for 1 player: ALLOWED (should be blocked!)');
      } catch (error) {
        console.log('✅ Duplicate booking correctly blocked');
      }
      
      // Verificar estado de la clase
      console.log('\n📊 Checking class status...');
      const classStatus = await prisma.$queryRaw`
        SELECT 
          ts.id,
          ts.maxPlayers,
          COALESCE(SUM(b.groupSize), 0) as totalPlayers,
          COUNT(b.id) as totalBookings
        FROM TimeSlot ts
        LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status = 'CONFIRMED'
        WHERE ts.id = ${testClassId}
        GROUP BY ts.id, ts.maxPlayers
      `;
      
      const status = classStatus[0];
      console.log(`📈 Class Status:`);
      console.log(`   Max players: ${status.maxPlayers}`);
      console.log(`   Current players: ${status.totalPlayers}`);
      console.log(`   Total bookings: ${status.totalBookings}`);
      console.log(`   Progress: ${Math.round((status.totalPlayers / status.maxPlayers) * 100)}%`);
      console.log(`   Class full: ${status.totalPlayers >= status.maxPlayers ? '✅ YES' : '❌ NO'}`);
      
      // Probar el endpoint admin
      console.log('\n🔗 Testing admin endpoint response...');
      const allBookings = await prisma.$queryRaw`
        SELECT 
          b.id,
          b.userId,
          b.timeSlotId,
          b.groupSize,
          b.status,
          u.name as userName,
          ts.start as timeSlotStart,
          ts.maxPlayers,
          (SELECT SUM(b2.groupSize) FROM Booking b2 
           WHERE b2.timeSlotId = ts.id 
           AND b2.status = 'CONFIRMED') as totalPlayersInClass
        FROM Booking b
        LEFT JOIN User u ON b.userId = u.id
        LEFT JOIN TimeSlot ts ON b.timeSlotId = ts.id
        WHERE b.timeSlotId = ${testClassId}
        ORDER BY b.createdAt DESC
      `;
      
      console.log(`📋 Found ${allBookings.length} bookings for test class:`);
      allBookings.forEach((booking, index) => {
        console.log(`   ${index + 1}. ${booking.userName} - Group size: ${booking.groupSize} - Status: ${booking.status}`);
      });
      
      if (allBookings.length > 0) {
        const firstBooking = allBookings[0];
        console.log(`\n🎯 Should this class appear in admin? ${firstBooking.totalPlayersInClass >= firstBooking.maxPlayers ? '✅ YES (complete)' : '❌ NO (incomplete)'}`);
      }
      
    } else {
      console.log('❌ Missing database entities, need to check database setup');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndTestBookingSystem();