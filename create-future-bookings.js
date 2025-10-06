const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFutureBookings() {
  try {
    console.log('📝 Creando reservas en clases futuras...');

    // Obtener las clases de mañana
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const nextDay = new Date(tomorrow);
    nextDay.setDate(nextDay.getDate() + 1);

    const futureClasses = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: tomorrow,
          lt: nextDay,
        }
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`🔍 Encontradas ${futureClasses.length} clases futuras`);

    if (futureClasses.length === 0) {
      console.log('❌ No hay clases futuras disponibles');
      return;
    }

    // Crear reservas en las primeras 3 clases
    const bookingsToCreate = [];
    
    for (let i = 0; i < Math.min(3, futureClasses.length); i++) {
      const timeSlot = futureClasses[i];
      
      bookingsToCreate.push({
        id: `booking-future-${i + 1}-${Date.now()}`,
        userId: 'user-alex-test',
        timeSlotId: timeSlot.id,
        status: 'CONFIRMED',
      });
    }

    // Crear las reservas
    for (const booking of bookingsToCreate) {
      await prisma.booking.create({
        data: booking
      });
    }

    console.log(`✅ ${bookingsToCreate.length} reservas futuras creadas para user-alex-test`);

    // Mostrar resumen
    console.log('\n📋 Reservas futuras creadas:');
    for (let i = 0; i < bookingsToCreate.length; i++) {
      const booking = bookingsToCreate[i];
      const timeSlot = futureClasses[i];
      const dateStr = timeSlot.start.toLocaleDateString('es-ES');
      const timeStr = timeSlot.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      
      console.log(`   ${i + 1}. ${dateStr} ${timeStr} - ${timeSlot.level} - €${timeSlot.totalPrice}`);
    }

    console.log('\n🎯 Ahora puedes:');
    console.log('   1. Ir a /my-bookings-simple');
    console.log('   2. Ver las reservas futuras con botón "Cancelar Reserva"');
    console.log('   3. Probar la funcionalidad de cancelación');

  } catch (error) {
    console.error('❌ Error creando reservas futuras:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFutureBookings();