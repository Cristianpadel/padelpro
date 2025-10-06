const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');
    
    // 1. Crear Admin
    console.log('👨‍💼 Creating admin...');
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Admin (id, email, name, role, isActive, createdAt, updatedAt)
      VALUES ('admin-1', 'admin@padelpro.com', 'Admin Principal', 'SUPER_ADMIN', 1, datetime('now'), datetime('now'))
    `;
    
    // 2. Crear Club
    console.log('🏢 Creating club...');
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Club (id, name, address, phone, email, adminId, createdAt, updatedAt)
      VALUES ('club-1', 'PadelPro Club', 'Calle Principal 123', '+34 600 123 456', 'club@padelpro.com', 'admin-1', datetime('now'), datetime('now'))
    `;
    
    // 3. Crear Courts
    console.log('🏟️ Creating courts...');
    for (let i = 1; i <= 3; i++) {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO Court (id, number, name, clubId, isActive, createdAt, updatedAt)
        VALUES ('court-${i}', ${i}, 'Pista ${i}', 'club-1', 1, datetime('now'), datetime('now'))
      `;
    }
    
    // 4. Crear Users
    console.log('👤 Creating users...');
    const users = [
      { id: 'user-alex', name: 'Alex García', email: 'alex.garcia@gmail.com' },
      { id: 'user-ana', name: 'Ana Martínez', email: 'ana.martinez@gmail.com' },
      { id: 'user-carlos', name: 'Carlos López', email: 'carlos.lopez@gmail.com' },
      { id: 'user-lucia', name: 'Lucía Rodríguez', email: 'lucia.rodriguez@gmail.com' }
    ];
    
    for (const user of users) {
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO User (id, email, name, phone, level, clubId, role, preference, visibility, credits, createdAt, updatedAt)
        VALUES (${user.id}, ${user.email}, ${user.name}, '+34 600 000 000', 'intermedio', 'club-1', 'PLAYER', 'NORMAL', 'PUBLIC', 0, datetime('now'), datetime('now'))
      `;
    }
    
    // 5. Crear Instructor
    console.log('👨‍🏫 Creating instructor...');
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO User (id, email, name, phone, level, clubId, role, preference, visibility, credits, createdAt, updatedAt)
      VALUES ('user-instructor', 'instructor@padelpro.com', 'Instructor Genérico', '+34 700 000 000', 'avanzado', 'club-1', 'INSTRUCTOR', 'NORMAL', 'PUBLIC', 0, datetime('now'), datetime('now'))
    `;
    
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Instructor (id, userId, name, specialties, clubId, isActive, createdAt, updatedAt)
      VALUES ('instructor-1', 'user-instructor', 'Instructor Genérico', 'Clases grupales', 'club-1', 1, datetime('now'), datetime('now'))
    `;
    
    // 6. Crear TimeSlots (clases)
    console.log('🕐 Creating time slots...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    for (let hour = 18; hour <= 20; hour++) {
      const start = new Date(tomorrow);
      start.setHours(hour, 0, 0, 0);
      
      const end = new Date(start);
      end.setHours(start.getHours() + 1, 30, 0, 0);
      
      const slotId = `slot-${hour}`;
      
      await prisma.$executeRaw`
        INSERT OR REPLACE INTO TimeSlot (
          id, clubId, courtId, instructorId, start, end, 
          maxPlayers, totalPrice, level, category, createdAt, updatedAt
        )
        VALUES (
          ${slotId}, 'club-1', 'court-1', 'instructor-1', 
          ${start.toISOString()}, ${end.toISOString()}, 
          4, 25.0, 'intermedio', 'class', datetime('now'), datetime('now')
        )
      `;
    }
    
    // 7. Crear Bookings de ejemplo
    console.log('📝 Creating test bookings...');
    
    // Alex García se inscribe en clase de las 18:00 para 1 jugador
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('booking-alex-1', 'user-alex', 'slot-18', 1, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    // Alex García se inscribe en la misma clase para 2 jugadores
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('booking-alex-2', 'user-alex', 'slot-18', 2, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    // Ana Martínez se inscribe para 1 jugador (completa la clase: 1+2+1=4)
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('booking-ana-1', 'user-ana', 'slot-18', 1, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    // Carlos López se inscribe en clase de las 19:00 para 2 jugadores (clase no completa)
    await prisma.$executeRaw`
      INSERT OR REPLACE INTO Booking (id, userId, timeSlotId, groupSize, status, createdAt, updatedAt)
      VALUES ('booking-carlos-1', 'user-carlos', 'slot-19', 2, 'CONFIRMED', datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Test data seeded successfully!');
    
    // 8. Verificar los datos creados
    console.log('\n📊 Verification:');
    
    const totalUsers = await prisma.$queryRaw`SELECT COUNT(*) as count FROM User`;
    console.log(`👥 Users: ${totalUsers[0].count}`);
    
    const totalTimeSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log(`🕐 TimeSlots: ${totalTimeSlots[0].count}`);
    
    const totalBookings = await prisma.$queryRaw`SELECT COUNT(*) as count FROM Booking`;
    console.log(`📝 Bookings: ${totalBookings[0].count}`);
    
    // Verificar clases completas
    const completeClasses = await prisma.$queryRaw`
      SELECT 
        ts.id,
        ts.start,
        ts.maxPlayers,
        SUM(b.groupSize) as totalPlayers
      FROM TimeSlot ts
      LEFT JOIN Booking b ON ts.id = b.timeSlotId AND b.status = 'CONFIRMED'
      GROUP BY ts.id
      HAVING SUM(b.groupSize) >= ts.maxPlayers
    `;
    
    console.log(`🎯 Complete classes: ${completeClasses.length}`);
    completeClasses.forEach(cls => {
      console.log(`   - ${cls.id}: ${cls.totalPlayers}/${cls.maxPlayers} players`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData();