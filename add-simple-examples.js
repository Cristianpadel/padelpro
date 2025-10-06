const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addSimpleExamples() {
  try {
    console.log('🎯 Añadiendo clases de ejemplo simples...');

    // Obtener usuarios existentes
    const users = await prisma.user.findMany({
      select: { id: true, name: true }
    });

    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
      return;
    }

    console.log(`📊 Encontrados ${users.length} usuarios disponibles`);
    
    // Usar el primer usuario
    const userId = users[0].id;
    console.log(`✅ Usando usuario: ${users[0].name} (${userId})`);

    // Obtener la fecha de hoy
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Clases de ejemplo para HOY con IDs únicos
    const timestamp = Date.now();
    const todayClasses = [
      {
        id: `static-${timestamp}-1`,
        clubId: 'basic-club', // Usar el club que existe
        courtId: 'cmfwmpa090004tgf4g13ed29e', // Usar pista existente
        instructorId: 'basic-instructor', // Usar instructor existente
        start: new Date(`${todayStr}T07:00:00.000Z`),
        end: new Date(`${todayStr}T08:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 25.00,
        level: 'principiante',
        category: 'class',
      },
      {
        id: `static-${timestamp}-2`,
        clubId: 'basic-club',
        courtId: 'cmfwmpa090004tgf4g13ed29e',
        instructorId: 'basic-instructor',
        start: new Date(`${todayStr}T20:00:00.000Z`),
        end: new Date(`${todayStr}T21:30:00.000Z`),
        maxPlayers: 4,
        totalPrice: 30.00,
        level: 'intermedio',
        category: 'class',
      }
    ];

    // Añadir las clases
    for (const classData of todayClasses) {
      await prisma.timeSlot.create({
        data: classData
      });
      console.log(`✅ Clase añadida: ${classData.id} - ${classData.level}`);
    }

    // Crear una reserva de ejemplo (opcional)
    try {
      await prisma.booking.create({
        data: {
          id: `booking-static-${timestamp}`,
          userId: userId,
          timeSlotId: `static-${timestamp}-1`,
          groupSize: 2
        }
      });
      console.log(`📝 Reserva añadida para la primera clase`);
    } catch (bookingError) {
      console.log(`⚠️  No se pudo crear reserva de ejemplo: ${bookingError.message}`);
    }

    console.log('🎉 ¡Clases estáticas añadidas exitosamente!');
    console.log('');
    console.log('📍 Ve a la página de clases y selecciona HOY para ver las nuevas tarjetas');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addSimpleExamples();