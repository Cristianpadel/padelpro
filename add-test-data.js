const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addTestData() {
  try {
    console.log('🚀 Agregando datos de prueba...');
    
    // Crear un admin primero
    const admin = await prisma.admin.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        name: 'Admin de Prueba',
        role: 'CLUB_ADMIN'
      }
    });
    console.log('✅ Admin creado:', admin.name);
    
    // Crear un club si no existe
    const club = await prisma.club.upsert({
      where: { id: 'club-1' },
      update: {},
      create: {
        id: 'club-1',
        name: 'Padel Estrella',
        address: 'Calle del Deporte 123, Madrid',
        phone: '123456789',
        email: 'info@padelestrella.com',
        adminId: admin.id
      }
    });
    console.log('✅ Club creado:', club.name);

    // Crear una cancha
    const court = await prisma.court.upsert({
      where: { id: 'court-1' },
      update: {},
      create: {
        id: 'court-1',
        clubId: 'club-1',
        number: 1,
        name: 'Cancha Principal'
      }
    });
    console.log('✅ Cancha creada: Cancha', court.number);

    // Crear un instructor
    const user = await prisma.user.upsert({
      where: { email: 'instructor@test.com' },
      update: {},
      create: {
        email: 'instructor@test.com',
        name: 'Instructor de Prueba',
        clubId: 'club-1',
        role: 'INSTRUCTOR'
      }
    });

    const instructor = await prisma.instructor.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        name: 'Instructor de Prueba',
        clubId: 'club-1',
        specialties: 'Técnica, Táctica',
        experience: '5 años de experiencia'
      }
    });
    console.log('✅ Instructor creado:', user.name);

    // Crear algunos slots de tiempo para hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const timeSlots = [];
    for (let hour = 9; hour <= 18; hour += 2) {
      const start = new Date(today);
      start.setHours(hour, 0, 0, 0);
      
      const end = new Date(start);
      end.setHours(hour + 2, 0, 0, 0);
      
      const slot = await prisma.timeSlot.create({
        data: {
          clubId: 'club-1',
          courtId: 'court-1',
          instructorId: instructor.id,
          start,
          end,
          maxPlayers: 4,
          totalPrice: 25,
          level: 'intermedio',
          category: 'clase_grupal'
        }
      });
      timeSlots.push(slot);
      console.log(`✅ Slot creado: ${hour}:00 - ${hour + 2}:00`);
    }

    // Crear algunos usuarios para las reservas, incluyendo Alex García
    const users = [];
    
    // Alex García - usuario principal
    const alexUser = await prisma.user.upsert({
      where: { email: 'alex.garcia@email.com' },
      update: {},
      create: {
        email: 'alex.garcia@email.com',
        name: 'Alex García',
        clubId: 'club-1',
        role: 'PLAYER',
        level: '3.5',
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    });
    users.push(alexUser);
    console.log(`✅ Usuario creado: ${alexUser.name}`);
    
    // Otros usuarios de prueba
    for (let i = 1; i <= 2; i++) {
      const testUser = await prisma.user.upsert({
        where: { email: `player${i}@test.com` },
        update: {},
        create: {
          email: `player${i}@test.com`,
          name: `Jugador ${i}`,
          clubId: 'club-1',
          role: 'PLAYER'
        }
      });
      users.push(testUser);
      console.log(`✅ Usuario creado: ${testUser.name}`);
    }

    // Crear reservas para algunas clases - versión simplificada sin groupSize por ahora
    // Clase de las 9:00 - Alex García + otro usuario
    await prisma.booking.create({
      data: {
        userId: users[0].id, // Alex García
        timeSlotId: timeSlots[0].id,
        status: 'CONFIRMED'
      }
    });
    await prisma.booking.create({
      data: {
        userId: users[1].id,
        timeSlotId: timeSlots[0].id,
        status: 'CONFIRMED'
      }
    });
    console.log('✅ Clase de 9:00 - 2 reservas CONFIRMADAS (Alex García + 1)');

    // Clase de las 11:00 - Una reserva pendiente
    await prisma.booking.create({
      data: {
        userId: users[2].id,
        timeSlotId: timeSlots[1].id,
        status: 'PENDING'
      }
    });
    console.log('✅ Clase de 11:00 - 1 reserva PENDIENTE');

    // Clase de las 13:00 - Sin reservas
    console.log('✅ Clase de 13:00 - SIN RESERVAS');

    console.log('\n🎉 Datos de prueba creados exitosamente!');
    console.log('📊 Resumen:');
    console.log('- 1 Club (Padel Estrella)');
    console.log('- 1 Cancha');
    console.log('- 1 Instructor');
    console.log('- 5 Slots de tiempo');
    console.log('- 3 Usuarios (incluyendo Alex García)');
    console.log('- 3 Reservas (Alex García incluido)');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addTestData();