const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createClassesWithClub() {
  try {
    console.log('🏗️ Creating classes with complete data structure...');
    
    // Verificar si ya existen datos
    const existingSlots = await prisma.timeSlot.count();
    console.log(`📊 Current TimeSlots: ${existingSlots}`);
    
    if (existingSlots > 0) {
      console.log('✅ Classes already exist, skipping creation');
      return;
    }
    
    console.log('🌱 Creating admin, club, and data structure...');
    
    // 1. Crear admin
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@basic.com' },
      update: {},
      create: {
        email: 'admin@basic.com',
        name: 'Admin Básico',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('👤 Created admin');
    
    // 2. Crear club
    const club = await prisma.club.upsert({
      where: { id: 'basic-club' },
      update: {},
      create: {
        id: 'basic-club',
        name: 'Club Básico',
        address: 'Dirección Básica',
        adminId: admin.id
      }
    });
    console.log('🏢 Created club');
    
    // 3. Crear usuario instructor
    const instructorUser = await prisma.user.upsert({
      where: { email: 'instructor@basic.com' },
      update: {},
      create: {
        email: 'instructor@basic.com',
        name: 'Instructor Básico',
        level: 'avanzado',
        role: 'INSTRUCTOR',
        preference: 'NORMAL',
        visibility: 'PUBLIC',
        credits: 0,
        clubId: club.id
      }
    });
    console.log('👤 Created instructor user');
    
    // 4. Crear instructor
    const instructor = await prisma.instructor.upsert({
      where: { id: 'basic-instructor' },
      update: {},
      create: {
        id: 'basic-instructor',
        userId: instructorUser.id,
        name: 'Instructor Básico',
        clubId: club.id
      }
    });
    console.log('👨‍🏫 Created instructor');
    
    // 5. Crear pista
    const court = await prisma.court.upsert({
      where: { 
        clubId_number: {
          clubId: club.id,
          number: 1
        }
      },
      update: {},
      create: {
        number: 1,
        name: 'Pista 1',
        clubId: club.id
      }
    });
    console.log('🏟️ Created court');
    
    // 6. Crear clases para los próximos días
    console.log('📅 Creating classes for the next few days...');
    
    const today = new Date();
    let classesCreated = 0;
    
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const date = new Date(today);
      date.setDate(date.getDate() + dayOffset);
      
      // Crear 3 clases por día en diferentes horarios
      for (let hour = 18; hour <= 20; hour++) {
        const start = new Date(date);
        start.setHours(hour, 0, 0, 0);
        
        const end = new Date(start);
        end.setMinutes(start.getMinutes() + 90); // 1.5 horas
        
        const levels = ['principiante', 'intermedio', 'avanzado'];
        const level = levels[hour - 18];
        
        const timeSlot = await prisma.timeSlot.create({
          data: {
            instructorId: instructor.id,
            courtId: court.id,
            clubId: club.id,
            start: start,
            end: end,
            maxPlayers: 4,
            totalPrice: 25.0,
            level: level,
            category: 'class'
          }
        });
        
        classesCreated++;
        console.log(`✅ Created class: ${level} at ${hour}:00 on ${date.toLocaleDateString()}`);
      }
    }
    
    console.log(`\n📊 Total classes created: ${classesCreated}`);
    
    // Mostrar algunas clases para verificar
    const sampleSlots = await prisma.timeSlot.findMany({
      take: 5,
      orderBy: { start: 'asc' },
      include: {
        instructor: true,
        court: true
      }
    });
    
    console.log('\n📖 Sample classes:');
    sampleSlots.forEach(slot => {
      const startDate = new Date(slot.start);
      console.log(`   - ${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString()} (${slot.level}) - ${slot.instructor.name} en ${slot.court.name}`);
    });
    
    console.log('\n✅ Basic classes created successfully!');
    console.log('🌐 You can now visit the classes panel to see available classes');
    
  } catch (error) {
    console.error('❌ Error creating classes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createClassesWithClub();