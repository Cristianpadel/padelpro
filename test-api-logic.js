const { PrismaClient } = require('@prisma/client');
const { addHours, addMinutes, startOfDay, endOfDay, format, isAfter, isBefore } = require('date-fns');

async function testAPI() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🧪 Probando la lógica del API directamente...');
    
    const date = "2024-01-18";
    const clubId = "cmfpu6vzq0002tgwk1tntqzsx";
    
    console.log('📥 Datos:', { date, clubId });
    
    const targetDate = new Date(date);
    const startTime = addHours(startOfDay(targetDate), 8);
    const endTime = addHours(startOfDay(targetDate), 22);
    console.log('⏰ Horario:', { startTime, endTime });

    // Buscar instructores
    console.log('🔍 Buscando instructores...');
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: clubId,
        isActive: true
      },
      include: {
        user: true
      }
    });
    
    console.log(`👨‍🏫 Instructores encontrados: ${instructors.length}`);
    instructors.forEach(instructor => {
      console.log(`  - ${instructor.user.name} (${instructor.id})`);
    });

    // Buscar canchas
    console.log('🏟️ Buscando canchas...');
    const courts = await prisma.court.findMany({
      where: {
        clubId: clubId,
        isActive: true
      }
    });
    
    console.log(`🎾 Canchas encontradas: ${courts.length}`);
    courts.forEach(court => {
      console.log(`  - ${court.name} (${court.id})`);
    });

    if (instructors.length > 0) {
      console.log('⚡ Probando crear un TimeSlot...');
      const instructor = instructors[0];
      const testStart = new Date(startTime);
      const testEnd = addMinutes(testStart, 90);
      
      console.log(`📝 Creando slot: ${format(testStart, 'HH:mm')} - ${format(testEnd, 'HH:mm')}`);
      
      const newSlot = await prisma.timeSlot.create({
        data: {
          clubId: clubId,
          instructorId: instructor.id,
          start: testStart,
          end: testEnd,
          maxPlayers: 4,
          totalPrice: 25.0,
          level: 'ABIERTO',
          category: 'ABIERTO'
          // courtId es null/opcional
        }
      });
      
      console.log(`✅ TimeSlot creado: ${newSlot.id}`);
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('💥 Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testAPI();