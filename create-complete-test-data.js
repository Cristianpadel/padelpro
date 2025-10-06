const { PrismaClient } = require('@prisma/client');

async function createTestClassesWithBookings() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Creando clases y reservas de prueba...');
    
    // Verificar si ya hay datos
    const existingSlots = await prisma.timeSlot.count();
    if (existingSlots > 0) {
      console.log('ℹ️ Ya hay', existingSlots, 'clases. Saltando creación.');
      return;
    }
    
    // Obtener club, court y crear instructor
    const club = await prisma.club.findFirst();
    const court = await prisma.court.findFirst();
    const user = await prisma.user.findFirst();
    
    if (!club || !court || !user) {
      console.log('❌ Faltan datos básicos. Ejecuta quick-seed.js primero.');
      return;
    }
    
    // Crear instructor si no existe
    let instructor = await prisma.instructor.findFirst();
    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: {
          userId: user.id,
          name: 'Instructor Pro',
          clubId: club.id,
          specialties: 'Clases grupales',
          hourlyRate: 25.0
        }
      });
    }
    
    console.log('✅ Usando instructor:', instructor.name);
    
    // Crear usuario específico para las pruebas
    let testUser = await prisma.user.findUnique({
      where: { id: 'cmfwmut4v0001tgs0en3il18d' }
    });
    
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          id: 'cmfwmut4v0001tgs0en3il18d',
          email: 'alex.garcia@test.com',
          name: 'Alex García',
          clubId: club.id,
          level: 'intermedio'
        }
      });
    }
    
    console.log('✅ Usuario de prueba:', testUser.name);
    
    // Crear segundo usuario
    let user2 = await prisma.user.findUnique({
      where: { id: 'cmfxhfr3a000ktg5gpwmo7xr8' }
    });
    
    if (!user2) {
      user2 = await prisma.user.create({
        data: {
          id: 'cmfxhfr3a000ktg5gpwmo7xr8',
          email: 'jugador2@test.com',
          name: 'Jugador 2',
          clubId: club.id,
          level: 'principiante'
        }
      });
    }
    
    console.log('✅ Usuario 2:', user2.name);
    
    // Crear clases para hoy (24 de septiembre de 2025)
    const today = new Date('2025-09-24');
    const timeSlots = [];
    
    const schedules = [
      { hour: 7, duration: 2 },
      { hour: 9, duration: 1.5 },
      { hour: 11, duration: 2 },
      { hour: 14, duration: 1.5 },
      { hour: 16, duration: 2 },
      { hour: 18, duration: 1.5 },
      { hour: 20, duration: 2 }
    ];
    
    for (let i = 0; i < schedules.length; i++) {
      const schedule = schedules[i];
      const startTime = new Date(today);
      startTime.setHours(schedule.hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setTime(startTime.getTime() + (schedule.duration * 60 * 60 * 1000));
      
      const timeSlotId = i === 0 ? 'cmfxhfr1t0006tg5g27smnm1d' : undefined;
      
      const timeSlot = await prisma.timeSlot.create({
        data: {
          id: timeSlotId,
          clubId: club.id,
          courtId: court.id,
          instructorId: instructor.id,
          start: startTime,
          end: endTime,
          maxPlayers: 4,
          totalPrice: 35.0,
          level: 'intermedio',
          category: 'clase_grupal'
        }
      });
      
      timeSlots.push(timeSlot);
      console.log(`✅ Clase ${i + 1} creada: ${schedule.hour}:00 - ${endTime.getHours()}:${endTime.getMinutes().toString().padStart(2, '0')}`);
    }
    
    // Crear reservas con diferentes groupSize
    console.log('\n📝 Creando reservas...');
    
    // Reserva 1: 4 jugadores en primera clase
    const booking1 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        timeSlotId: timeSlots[0].id,
        groupSize: 4,
        status: 'CONFIRMED'
      }
    });
    console.log('✅ Reserva 1: 4 jugadores - CONFIRMADA');
    
    // Reserva 2: 2 jugadores en segunda clase
    const booking2 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        timeSlotId: timeSlots[1].id,
        groupSize: 2,
        status: 'CONFIRMED'
      }
    });
    console.log('✅ Reserva 2: 2 jugadores - CONFIRMADA');
    
    // Reserva 3: 1 jugador en tercera clase (PENDIENTE)
    const booking3 = await prisma.booking.create({
      data: {
        userId: user2.id,
        timeSlotId: timeSlots[2].id,
        groupSize: 1,
        status: 'PENDING'
      }
    });
    console.log('✅ Reserva 3: 1 jugador - PENDIENTE');
    
    // Reserva 4: 3 jugadores en cuarta clase
    const booking4 = await prisma.booking.create({
      data: {
        userId: testUser.id,
        timeSlotId: timeSlots[3].id,
        groupSize: 3,
        status: 'CONFIRMED'
      }
    });
    console.log('✅ Reserva 4: 3 jugadores - CONFIRMADA');
    
    console.log('\n🎉 ¡DATOS CREADOS EXITOSAMENTE!');
    console.log('📊 Resumen:');
    console.log(`   - ${timeSlots.length} clases creadas para hoy (2025-09-24)`);
    console.log(`   - 4 reservas creadas con diferentes groupSize`);
    console.log(`   - 3 reservas CONFIRMADAS, 1 PENDIENTE`);
    
    // Verificar datos
    const finalCount = await prisma.timeSlot.count();
    const bookingCount = await prisma.booking.count();
    console.log(`\n✅ Verificación final:`);
    console.log(`   - TimeSlots en BD: ${finalCount}`);
    console.log(`   - Bookings en BD: ${bookingCount}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestClassesWithBookings();