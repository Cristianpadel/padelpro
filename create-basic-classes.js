const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBasicClasses() {
  try {
    console.log('🏗️ Creating basic classes...');
    
    // Primero, verificar si ya existen datos
    const existingSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log(`📊 Current TimeSlots: ${existingSlots[0].count}`);
    
    if (existingSlots[0].count > 0) {
      console.log('✅ Classes already exist, skipping creation');
      return;
    }
    
    // Crear datos mínimos directamente
    console.log('🌱 Creating basic data structure...');
    
    // 1. Crear club básico si no existe
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO Club (id, name, address, adminId, createdAt, updatedAt)
      VALUES ('basic-club', 'Club Básico', 'Dirección Básica', 'basic-admin', datetime('now'), datetime('now'))
    `;
    
    // 2. Crear admin básico si no existe
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO Admin (id, email, name, role, createdAt, updatedAt)
      VALUES ('basic-admin', 'admin@basic.com', 'Admin Básico', 'SUPER_ADMIN', datetime('now'), datetime('now'))
    `;
    
    // 3. Crear usuario instructor básico
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO User (id, email, name, level, clubId, role, preference, visibility, credits, createdAt, updatedAt)
      VALUES ('basic-instructor-user', 'instructor@basic.com', 'Instructor Básico', 'avanzado', 'basic-club', 'INSTRUCTOR', 'NORMAL', 'PUBLIC', 0, datetime('now'), datetime('now'))
    `;
    
    // 4. Crear instructor
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO Instructor (id, userId, name, clubId, createdAt, updatedAt)
      VALUES ('basic-instructor', 'basic-instructor-user', 'Instructor Básico', 'basic-club', datetime('now'), datetime('now'))
    `;
    
    // 5. Crear pista básica
    await prisma.$executeRaw`
      INSERT OR IGNORE INTO Court (id, number, clubId, createdAt, updatedAt)
      VALUES ('basic-court', 1, 'basic-club', datetime('now'), datetime('now'))
    `;
    
    // 6. Crear clases para los próximos días
    console.log('📅 Creating classes for the next few days...');
    
    const today = new Date();
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      
      // Crear 3 clases por día en diferentes horarios
      for (let hour = 18; hour <= 20; hour++) {
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 90); // 1.5 horas
        
        const slotId = `basic-slot-${date.getDate()}-${hour}`;
        const levels = ['principiante', 'intermedio', 'avanzado'];
        const level = levels[hour - 18]; // 18->principiante, 19->intermedio, 20->avanzado
        
        await prisma.$executeRaw`
          INSERT OR IGNORE INTO TimeSlot (
            id, clubId, courtId, instructorId, start, end, 
            maxPlayers, totalPrice, level, category, createdAt, updatedAt
          )
          VALUES (
            ${slotId}, 'basic-club', 'basic-court', 'basic-instructor',
            ${start.toISOString()}, ${end.toISOString()},
            4, 25.0, ${level}, 'class', datetime('now'), datetime('now')
          )
        `;
        
        console.log(`✅ Created class: ${slotId} (${level} at ${hour}:00)`);
      }
    }
    
    // 7. Verificar las clases creadas
    const totalSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log(`📊 Total classes created: ${totalSlots[0].count}`);
    
    // Mostrar algunas clases para verificar
    const sampleSlots = await prisma.$queryRaw`
      SELECT id, start, level, category 
      FROM TimeSlot 
      ORDER BY start ASC 
      LIMIT 5
    `;
    
    console.log('\n📖 Sample classes:');
    sampleSlots.forEach(slot => {
      const startDate = new Date(slot.start);
      console.log(`   - ${slot.id}: ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} (${slot.level})`);
    });
    
    console.log('\n✅ Basic classes created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating basic classes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBasicClasses();