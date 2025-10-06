const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createClassesForPadelEstrella() {
  try {
    // Buscar el club, pistas e instructor
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' },
      include: { 
        courts: true,
        instructors: true
      }
    });
    
    if (!club) {
      throw new Error('Club Padel Estrella no encontrado');
    }
    
    const instructor = club.instructors[0];
    if (!instructor) {
      throw new Error('No hay instructores disponibles para el club');
    }
    
    console.log('🏢 Club:', club.name);
    console.log('🎾 Pistas disponibles:', club.courts.length);
    
    const classes = [];
    const today = new Date('2025-09-21'); // Fecha actual
    
    // Crear clases para hoy y los próximos 6 días
    for (let day = 0; day < 7; day++) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() + day);
      
      console.log(`📅 Creando clases para: ${currentDate.toISOString().split('T')[0]}`);
      
      // Horarios de clases (9:00 a 20:00, cada 2 horas)
      const hours = [9, 11, 13, 15, 17, 19];
      const levels = ['principiante', 'intermedio', 'avanzado', 'abierto'];
      
      for (const hour of hours) {
        // Alternar entre diferentes pistas
        const court = club.courts[hour % club.courts.length];
        const level = levels[hour % levels.length];
        
        const startTime = new Date(currentDate);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 30, 0, 0); // 1.5 horas por clase
        
        const timeSlot = await prisma.timeSlot.create({
          data: {
            clubId: club.id,
            courtId: court.id,
            instructorId: instructor.id,
            start: startTime,
            end: endTime,
            maxPlayers: 4,
            totalPrice: 25.0,
            level: level,
            category: 'class'
          }
        });
        
        classes.push(timeSlot);
        console.log(`  ⏰ ${hour}:00-${hour+1}:30 - ${level} - Pista ${court.number} - ID: ${timeSlot.id}`);
      }
    }
    
    console.log(`✅ ${classes.length} clases creadas para ${club.name}`);
    console.log('🎯 Las clases están listas para verse en la web!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createClassesForPadelEstrella();