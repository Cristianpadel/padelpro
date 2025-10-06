const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDatabaseIds() {
  try {
    console.log('🔍 Checking existing IDs in database...');
    
    // Verificar clubs
    const clubs = await prisma.$queryRaw`SELECT id, name FROM Club LIMIT 3`;
    console.log('\n🏢 Clubs:');
    clubs.forEach(club => {
      console.log(`   - ${club.id}: ${club.name}`);
    });
    
    // Verificar courts
    const courts = await prisma.$queryRaw`SELECT id, number, clubId FROM Court LIMIT 3`;
    console.log('\n🏟️ Courts:');
    courts.forEach(court => {
      console.log(`   - ${court.id}: Court ${court.number} (Club: ${court.clubId})`);
    });
    
    // Verificar instructors
    const instructors = await prisma.$queryRaw`SELECT id, name, clubId FROM Instructor LIMIT 3`;
    console.log('\n👨‍🏫 Instructors:');
    instructors.forEach(instructor => {
      console.log(`   - ${instructor.id}: ${instructor.name} (Club: ${instructor.clubId})`);
    });
    
    // Verificar users
    const users = await prisma.$queryRaw`SELECT id, name FROM User WHERE id LIKE 'player-%' LIMIT 3`;
    console.log('\n👤 Users:');
    users.forEach(user => {
      console.log(`   - ${user.id}: ${user.name}`);
    });
    
    if (clubs.length > 0 && courts.length > 0 && instructors.length > 0) {
      const club = clubs[0];
      const court = courts[0];
      const instructor = instructors[0];
      
      console.log('\n🏗️ Creating test class with valid IDs...');
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(18, 0, 0, 0);
      
      const end = new Date(tomorrow);
      end.setHours(19, 30, 0, 0);
      
      const classId = `test-class-${Date.now()}`;
      
      await prisma.$executeRaw`
        INSERT INTO TimeSlot (
          id, clubId, courtId, instructorId, start, end, 
          maxPlayers, totalPrice, level, category, createdAt, updatedAt
        )
        VALUES (
          ${classId}, 
          ${club.id}, 
          ${court.id}, 
          ${instructor.id}, 
          ${tomorrow.toISOString()}, 
          ${end.toISOString()}, 
          4, 
          25.0, 
          'intermedio', 
          'class', 
          datetime('now'), 
          datetime('now')
        )
      `;
      
      console.log(`✅ Created test class: ${classId}`);
      
      // Ahora probar las reservas
      if (users.length > 0) {
        const user = users[0];
        console.log(`\n🎯 Testing bookings for user: ${user.name} (${user.id})`);
        
        // Inscripción para 1 jugador
        try {
          const bookingId1 = `booking-${Date.now()}-1`;
          await prisma.$executeRaw`
            INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
            VALUES (${bookingId1}, ${user.id}, ${classId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
          `;
          console.log('✅ Group size 1: Success');
        } catch (error) {
          console.log('❌ Group size 1 error:', error.message);
        }
        
        // Inscripción para 2 jugadores
        try {
          const bookingId2 = `booking-${Date.now()}-2`;
          await prisma.$executeRaw`
            INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
            VALUES (${bookingId2}, ${user.id}, ${classId}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
          `;
          console.log('✅ Group size 2: Success');
        } catch (error) {
          console.log('❌ Group size 2 error:', error.message);
        }
        
        // Verificar total de jugadores
        const totalPlayers = await prisma.$queryRaw`
          SELECT SUM(groupSize) as total
          FROM Booking
          WHERE timeSlotId = ${classId} AND status = 'CONFIRMED'
        `;
        
        const total = totalPlayers[0]?.total || 0;
        console.log(`\n📊 Total players in class: ${total}/4`);
        console.log(`🎯 Class full: ${total >= 4 ? '✅ YES' : '❌ NO'}`);
        
        console.log('\n🔗 Testing admin endpoint...');
        
      } else {
        console.log('❌ No users found for testing');
      }
    } else {
      console.log('❌ Missing required entities in database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseIds();