const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createBasicClasses() {
  try {
    console.log('🏗️ Creating basic classes with Prisma ORM...');
    
    // Verificar si ya existen datos
    const existingSlots = await prisma.timeSlot.count();
    console.log(`📊 Current TimeSlots: ${existingSlots}`);
    
    if (existingSlots > 0) {
      console.log('✅ Classes already exist, skipping creation');
      return;
    }
    
    console.log('🌱 Creating basic data structure...');
    
    // 1. Crear usuario instructor básico
    const instructorUser = await prisma.user.upsert({
      where: { id: 'basic-instructor-user' },
      update: {},
      create: {
        id: 'basic-instructor-user',
        email: 'instructor@basic.com',
        name: 'Instructor Básico',
        level: 'avanzado',
        role: 'INSTRUCTOR',
        preference: 'NORMAL',
        visibility: 'PUBLIC',
        credits: 0
      }
    });
    console.log('👤 Created instructor user');
    
    // 2. Crear instructor
    const instructor = await prisma.instructor.upsert({
      where: { id: 'basic-instructor' },
      update: {},
      create: {
        id: 'basic-instructor',
        userId: instructorUser.id,
        name: 'Instructor Básico'
      }
    });
    console.log('👨‍🏫 Created instructor');
    
    // 3. Crear pista básica
    const court = await prisma.court.upsert({
      where: { id: 'basic-court' },
      update: {},
      create: {
        id: 'basic-court',
        number: 1
      }
    });
    console.log('🏟️ Created court');
    
    // 4. Crear clases para los próximos días
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
        
        const slotId = `basic-slot-${date.getDate()}-${hour}`;
        const levels = ['principiante', 'intermedio', 'avanzado'];
        const level = levels[hour - 18]; // 18->principiante, 19->intermedio, 20->avanzado
        
        const timeSlot = await prisma.timeSlot.create({
          data: {
            id: slotId,
            instructorId: instructor.id,
            courtId: court.id,
            start: start,
            end: end,
            maxPlayers: 4,
            totalPrice: 25.0,
            level: level,
            category: 'class'
          }
        });
        
        classesCreated++;
        console.log(`✅ Created class: ${slotId} (${level} at ${hour}:00)`);
      }
    }
    
    console.log(`\n📊 Total classes created: ${classesCreated}`);
    
    // Mostrar algunas clases para verificar
    const sampleSlots = await prisma.timeSlot.findMany({
      take: 5,
      orderBy: { start: 'asc' },
      select: {
        id: true,
        start: true,
        level: true,
        category: true
      }
    });
    
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