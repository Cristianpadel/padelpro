const { PrismaClient } = require('@prisma/client');

async function createBookingsOnly() {
  const prisma = new PrismaClient();
  
  try {
    console.log('📝 Creando solo las reservas...');
    
    // Verificar si ya hay reservas
    const existingBookings = await prisma.booking.count();
    if (existingBookings > 0) {
      console.log('ℹ️ Ya hay', existingBookings, 'reservas. Eliminando para recrear...');
      await prisma.booking.deleteMany();
    }
    
    // Obtener las clases existentes
    const timeSlots = await prisma.timeSlot.findMany({
      orderBy: { start: 'asc' }
    });
    
    if (timeSlots.length === 0) {
      console.log('❌ No hay clases disponibles');
      return;
    }
    
    console.log(`✅ Encontradas ${timeSlots.length} clases`);
    
    // Obtener usuarios
    const testUser = await prisma.user.findUnique({
      where: { id: 'cmfwmut4v0001tgs0en3il18d' }
    });
    
    const user2 = await prisma.user.findUnique({
      where: { id: 'cmfxhfr3a000ktg5gpwmo7xr8' }
    });
    
    if (!testUser || !user2) {
      console.log('❌ No se encontraron los usuarios de prueba');
      return;
    }
    
    console.log('✅ Usuarios encontrados:', testUser.name, 'y', user2.name);
    
    // Crear reservas específicas
    const bookings = [];
    
    // Reserva 1: 4 jugadores en primera clase
    if (timeSlots[0]) {
      const booking1 = await prisma.booking.create({
        data: {
          userId: testUser.id,
          timeSlotId: timeSlots[0].id,
          groupSize: 4,
          status: 'CONFIRMED'
        }
      });
      bookings.push(booking1);
      console.log('✅ Reserva 1: 4 jugadores en', timeSlots[0].id.substring(0, 8), '- CONFIRMADA');
    }
    
    // Reserva 2: 2 jugadores en segunda clase
    if (timeSlots[1]) {
      const booking2 = await prisma.booking.create({
        data: {
          userId: testUser.id,
          timeSlotId: timeSlots[1].id,
          groupSize: 2,
          status: 'CONFIRMED'
        }
      });
      bookings.push(booking2);
      console.log('✅ Reserva 2: 2 jugadores en', timeSlots[1].id.substring(0, 8), '- CONFIRMADA');
    }
    
    // Reserva 3: 1 jugador en tercera clase (PENDIENTE)
    if (timeSlots[2]) {
      const booking3 = await prisma.booking.create({
        data: {
          userId: user2.id,
          timeSlotId: timeSlots[2].id,
          groupSize: 1,
          status: 'PENDING'
        }
      });
      bookings.push(booking3);
      console.log('✅ Reserva 3: 1 jugador en', timeSlots[2].id.substring(0, 8), '- PENDIENTE');
    }
    
    // Reserva 4: 3 jugadores en cuarta clase
    if (timeSlots[3]) {
      const booking4 = await prisma.booking.create({
        data: {
          userId: testUser.id,
          timeSlotId: timeSlots[3].id,
          groupSize: 3,
          status: 'CONFIRMED'
        }
      });
      bookings.push(booking4);
      console.log('✅ Reserva 4: 3 jugadores en', timeSlots[3].id.substring(0, 8), '- CONFIRMADA');
    }
    
    // Reserva 5: Otra reserva en la primera clase (diferente groupSize)
    if (timeSlots[0]) {
      const booking5 = await prisma.booking.create({
        data: {
          userId: user2.id,
          timeSlotId: timeSlots[0].id,
          groupSize: 2,
          status: 'PENDING'
        }
      });
      bookings.push(booking5);
      console.log('✅ Reserva 5: 2 jugadores en', timeSlots[0].id.substring(0, 8), '- PENDIENTE');
    }
    
    console.log('\n🎉 ¡RESERVAS CREADAS EXITOSAMENTE!');
    console.log('📊 Resumen:');
    console.log(`   - ${bookings.length} reservas creadas`);
    console.log(`   - ${bookings.filter(b => b.status === 'CONFIRMED').length} CONFIRMADAS`);
    console.log(`   - ${bookings.filter(b => b.status === 'PENDING').length} PENDIENTES`);
    
    // Verificación final con detalles
    console.log('\n🔍 Verificación detallada:');
    const allBookings = await prisma.booking.findMany({
      include: {
        user: { select: { name: true } },
        timeSlot: { 
          select: { 
            id: true, 
            start: true,
            level: true,
            category: true 
          } 
        }
      }
    });
    
    allBookings.forEach((booking, index) => {
      const timeStr = new Date(booking.timeSlot.start).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log(`📋 ${index + 1}. ${booking.user.name} - ${booking.groupSize} jugadores - ${timeStr} - ${booking.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createBookingsOnly();