const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFutureClasses() {
  try {
    console.log('🏁 Creando clases futuras para probar cancelaciones...');

    const now = new Date();
    const currentHour = now.getHours();
    
    // Crear clases para hoy pero con horas futuras
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const futureClassesToday = [];
    const classesTomorrow = [];

    // Clases para hoy (solo si quedan horas futuras)
    if (currentHour < 18) {
      for (let hour = Math.max(currentHour + 1, 18); hour <= 21; hour += 2) {
        const startTime = new Date(today);
        startTime.setHours(hour, 0, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(hour + 1, 30, 0, 0);

        futureClassesToday.push({
          id: `class-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}-${hour}-inst-${hour % 2 + 1}`,
          clubId: 'club-1',
          courtId: hour % 2 === 0 ? 'court-1' : 'court-2',
          instructorId: hour % 2 === 0 ? 'instructor-1' : 'instructor-2',
          start: startTime,
          end: endTime,
          maxPlayers: 4,
          totalPrice: 45 + (hour - 18) * 5, // Precios progresivos
          level: ['principiante', 'intermedio', 'avanzado'][hour % 3],
          category: ['abierta', 'femenina', 'masculina'][hour % 3],
        });
      }
    }

    // Clases para mañana
    for (let hour = 9; hour <= 20; hour += 2) {
      const startTime = new Date(tomorrow);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + 1, 30, 0, 0);

      classesTomorrow.push({
        id: `class-${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}-${hour}-inst-${hour % 2 + 1}`,
        clubId: 'club-1',
        courtId: hour % 2 === 0 ? 'court-1' : 'court-2',
        instructorId: hour % 2 === 0 ? 'instructor-1' : 'instructor-2',
        start: startTime,
        end: endTime,
        maxPlayers: 4,
        totalPrice: 40 + hour * 2, // Precios progresivos
        level: ['principiante', 'intermedio', 'avanzado'][hour % 3],
        category: ['abierta', 'femenina', 'masculina'][hour % 3],
      });
    }

    const allNewClasses = [...futureClassesToday, ...classesTomorrow];

    // Crear las clases en la base de datos
    for (const classData of allNewClasses) {
      await prisma.timeSlot.upsert({
        where: { id: classData.id },
        update: classData,
        create: classData,
      });
    }

    console.log(`✅ ${futureClassesToday.length} clases futuras creadas para HOY`);
    console.log(`✅ ${classesTomorrow.length} clases creadas para MAÑANA`);
    console.log(`📅 Total: ${allNewClasses.length} clases futuras disponibles`);

    // Mostrar algunas clases creadas
    console.log('\n📋 Clases futuras creadas:');
    allNewClasses.slice(0, 5).forEach((cls, index) => {
      const dateStr = cls.start.toLocaleDateString('es-ES');
      const timeStr = cls.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      console.log(`   ${index + 1}. ${dateStr} ${timeStr} - ${cls.level} - €${cls.totalPrice}`);
    });

    if (allNewClasses.length > 5) {
      console.log(`   ... y ${allNewClasses.length - 5} más`);
    }

    console.log('\n🎯 Ahora puedes:');
    console.log('   1. Ver las clases futuras en /activities');
    console.log('   2. Hacer reservas en las nuevas clases');
    console.log('   3. Probar el botón cancelar en /my-bookings-simple');

  } catch (error) {
    console.error('❌ Error creando clases futuras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFutureClasses();