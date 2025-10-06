const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addExampleClasses() {
  try {
    console.log('🎯 Añadiendo clases de ejemplo estáticas...');

    // Obtener la fecha de hoy y mañana
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Clases estáticas de ejemplo para HOY
    const todayClasses = [
      {
        id: `example-today-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-1',
        start: new Date(`${today.toISOString().split('T')[0]}T09:00:00.000Z`),
        end: new Date(`${today.toISOString().split('T')[0]}T10:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 25.00,
        level: 'Principiante',
        category: 'Clase Grupal',
      },
      {
        id: `example-today-2`,
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'instructor-2',
        start: new Date(`${today.toISOString().split('T')[0]}T11:00:00.000Z`),
        end: new Date(`${today.toISOString().split('T')[0]}T12:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 30.00,
        level: 'Intermedio',
        category: 'Entrenamiento',
      },
      {
        id: `example-today-3`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-1',
        start: new Date(`${today.toISOString().split('T')[0]}T16:00:00.000Z`),
        end: new Date(`${today.toISOString().split('T')[0]}T17:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 35.00,
        level: 'Avanzado',
        category: 'Clase Grupal',
      }
    ];

    // Clases estáticas de ejemplo para MAÑANA
    const tomorrowClasses = [
      {
        id: `example-tomorrow-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-2',
        start: new Date(`${tomorrow.toISOString().split('T')[0]}T08:00:00.000Z`),
        end: new Date(`${tomorrow.toISOString().split('T')[0]}T09:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 28.00,
        level: 'Intermedio',
        category: 'Clase Matinal',
      },
      {
        id: `example-tomorrow-2`,
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'instructor-1',
        start: new Date(`${tomorrow.toISOString().split('T')[0]}T18:00:00.000Z`),
        end: new Date(`${tomorrow.toISOString().split('T')[0]}T19:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 32.00,
        level: 'Avanzado',
        category: 'Clase Vespertina',
      }
    ];

    // Añadir todas las clases
    const allExampleClasses = [...todayClasses, ...tomorrowClasses];
    
    for (const classData of allExampleClasses) {
      // Verificar si ya existe esta clase
      const existingClass = await prisma.timeSlot.findUnique({
        where: { id: classData.id }
      });

      if (!existingClass) {
        await prisma.timeSlot.create({
          data: classData
        });
        console.log(`✅ Clase añadida: ${classData.id} - ${classData.level} (${classData.category})`);
      } else {
        console.log(`⚠️  Clase ya existe: ${classData.id}`);
      }
    }

    // Crear algunas reservas de ejemplo para mostrar las tarjetas con jugadores
    const exampleBookings = [
      {
        id: 'booking-example-1',
        userId: 'user-1',
        timeSlotId: 'example-today-1',
        groupSize: 2,
      },
      {
        id: 'booking-example-2',
        userId: 'user-2',
        timeSlotId: 'example-today-2',
        groupSize: 1,
      }
    ];

    for (const bookingData of exampleBookings) {
      // Verificar si ya existe esta reserva
      const existingBooking = await prisma.booking.findUnique({
        where: { id: bookingData.id }
      });

      if (!existingBooking) {
        await prisma.booking.create({
          data: bookingData
        });
        console.log(`📝 Reserva añadida: ${bookingData.id} (${bookingData.groupSize} jugadores)`);
      } else {
        console.log(`⚠️  Reserva ya existe: ${bookingData.id}`);
      }
    }

    console.log('🎉 ¡Clases de ejemplo añadidas exitosamente!');
    console.log('');
    console.log('📅 Clases añadidas:');
    console.log(`   - HOY (${today.toDateString()}): ${todayClasses.length} clases`);
    console.log(`   - MAÑANA (${tomorrow.toDateString()}): ${tomorrowClasses.length} clases`);
    console.log('');
    console.log('🔍 Ahora puedes ver las tarjetas originales del panel de clases:');
    console.log('   1. Ve a la página de clases');
    console.log('   2. Selecciona el modo "Original"');
    console.log('   3. Verás las tarjetas ClassCardReal funcionando');
    console.log('   4. Las tarjetas de la base de datos admin siguen funcionando igual');

  } catch (error) {
    console.error('❌ Error añadiendo clases de ejemplo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addExampleClasses();