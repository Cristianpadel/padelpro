const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteAndRecreateClasses() {
  try {
    // Eliminar todas las clases de Padel Estrella
    const deleted = await prisma.timeSlot.deleteMany({
      where: {
        clubId: 'cmftnbe2o0001tgkobtrxipip',
        category: 'class'
      }
    });
    
    console.log(`🗑️  ${deleted.count} clases eliminadas`);
    
    // Buscar el club, pistas e instructor
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' },
      include: { 
        courts: true,
        instructors: true
      }
    });
    
    const instructor = club.instructors[0];
    
    console.log('🏢 Club:', club.name);
    console.log('🎾 Pistas disponibles:', club.courts.length);
    
    const classes = [];
    
    // Crear clases para hoy y los próximos 6 días
    for (let day = 0; day < 7; day++) {
      // Usar fechas locales sin conversion UTC problemática
      const currentDate = new Date(2025, 8, 21 + day); // Septiembre es mes 8 (0-indexed)
      
      console.log(`📅 Creando clases para: ${currentDate.toLocaleDateString('es-ES')}`);
      
      // Horarios de clases (9:00 a 19:00, cada 2 horas)
      const hours = [9, 11, 13, 15, 17, 19];
      const levels = ['principiante', 'intermedio', 'avanzado', 'abierto'];
      
      for (const hour of hours) {
        // Alternar entre diferentes pistas
        const court = club.courts[hour % club.courts.length];
        const level = levels[hour % levels.length];
        
        // Crear fecha y hora locales correctamente
        const startTime = new Date(2025, 8, 21 + day, hour, 0, 0, 0);
        const endTime = new Date(2025, 8, 21 + day, hour + 1, 30, 0, 0);
        
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
    
    console.log(`✅ ${classes.length} clases creadas correctamente para ${club.name}`);
    console.log('🎯 Las clases están listas para verse en la web!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAndRecreateClasses();