const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestClasses() {
  try {
    console.log('🏗️ Creating test classes for today...');
    
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Crear clases para hoy en diferentes horarios
    const classesData = [
      {
        hour: 18, // 6 PM
        level: 'principiante',
        category: 'class'
      },
      {
        hour: 19, // 7 PM
        level: 'intermedio',
        category: 'class'
      },
      {
        hour: 20, // 8 PM
        level: 'avanzado',
        category: 'class'
      }
    ];
    
    for (const classData of classesData) {
      const start = new Date(tomorrow);
      start.setHours(classData.hour, 0, 0, 0);
      
      const end = new Date(start);
      end.setHours(start.getHours() + 1, 30, 0, 0); // 1.5 horas de duración
      
      const classId = `test-class-${Date.now()}-${classData.hour}`;
      
      await prisma.$executeRaw`
        INSERT INTO TimeSlot (
          id, clubId, courtId, instructorId, start, end, 
          maxPlayers, totalPrice, level, category, createdAt, updatedAt
        )
        VALUES (
          ${classId}, 
          'cmftnbe2o0001tgkobtrxipip', 
          'cmftne6ub0001tgzoka55qw0d', 
          'cmftngven0003tg6waunj91gt', 
          ${start.toISOString()}, 
          ${end.toISOString()}, 
          4, 
          25.0, 
          ${classData.level}, 
          ${classData.category}, 
          datetime('now'), 
          datetime('now')
        )
      `;
      
      console.log(`✅ Created class: ${classId} (${classData.level} at ${classData.hour}:00)`);
    }
    
    console.log('\n🎯 Now testing booking system...');
    
    // Usar la primera clase creada para las pruebas
    const testClassId = `test-class-${Date.now()}-18`;
    const userId = 'player-alex'; // Alex García
    
    console.log(`📖 Testing with class: ${testClassId.substring(0, 20)}...`);
    
    // Inscripción para 1 jugador
    try {
      console.log('📝 Booking for 1 player...');
      const bookingId1 = `booking-${Date.now()}-1player`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId1}, ${userId}, ${testClassId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
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
        VALUES (${bookingId2}, ${userId}, ${testClassId}, 2, 'CONFIRMED', datetime('now'), datetime('now'))
      `;
      console.log('✅ Group size 2: Success');
    } catch (error) {
      console.log('❌ Group size 2 error:', error.message);
    }
    
    // Inscripción para 1 jugador adicional (debería completar la clase: 1+2+1=4)
    try {
      console.log('📝 Booking for 1 more player (should complete class)...');
      const bookingId3 = `booking-${Date.now()}-1more`;
      await prisma.$executeRaw`
        INSERT INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
        VALUES (${bookingId3}, 'player-lucia', ${testClassId}, 1, 'CONFIRMED', datetime('now'), datetime('now'))
      `;
      console.log('✅ Additional player: Success');
    } catch (error) {
      console.log('❌ Additional player error:', error.message);
    }
    
    // Verificar el estado de la clase
    console.log('\n📊 Checking class status...');
    const classStatus = await prisma.$queryRaw`
      SELECT 
        ts.id,
        ts.maxPlayers,
        SUM(b.groupSize) as totalPlayers,
        COUNT(b.id) as totalBookings
      FROM TimeSlot ts
      LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status = 'CONFIRMED'
      WHERE ts.id = ${testClassId}
      GROUP BY ts.id
    `;
    
    if (classStatus.length > 0) {
      const status = classStatus[0];
      console.log(`📊 Class ${status.id.substring(0, 20)}...:`);
      console.log(`   Max players: ${status.maxPlayers}`);
      console.log(`   Current players: ${status.totalPlayers || 0}`);
      console.log(`   Total bookings: ${status.totalBookings || 0}`);
      console.log(`   Class full: ${(status.totalPlayers || 0) >= status.maxPlayers ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('\n🎯 Testing admin endpoint...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClasses();