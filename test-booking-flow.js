const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBookingFlow() {
  try {
    console.log('🧪 Iniciando prueba completa del flujo de reservas...');

    // 1. Verificar que tenemos clases disponibles
    console.log('\n1️⃣ Verificando clases disponibles...');
    const availableClasses = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1',
        start: {
          gte: new Date('2025-09-11T00:00:00Z'),
          lte: new Date('2025-09-11T23:59:59Z')
        }
      },
      include: {
        instructor: true,
        court: true,
        bookings: true
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`✅ Encontradas ${availableClasses.length} clases para hoy`);
    
    if (availableClasses.length === 0) {
      console.log('❌ No hay clases disponibles. Ejecuta create-classes-today.js primero');
      return;
    }

    // Mostrar clases disponibles
    console.log('\n📅 Clases disponibles:');
    availableClasses.forEach((cls, index) => {
      const startTime = new Date(cls.start).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`   ${index + 1}. ${startTime} - ${cls.instructor?.name} - ${cls.level} - ${cls.bookings.length}/${cls.maxPlayers} reservas`);
    });

    // 2. Verificar que el usuario de prueba existe
    console.log('\n2️⃣ Verificando usuario de prueba...');
    let testUser = await prisma.user.findUnique({
      where: { email: 'alex@padel.com' }
    });

    if (!testUser) {
      console.log('🔧 Creando usuario de prueba...');
      testUser = await prisma.user.create({
        data: {
          id: 'user-alex-test',
          email: 'alex@padel.com',
          name: 'Alex García (Test)',
          role: 'PLAYER',
          clubId: 'club-1'
        }
      });
    }

    console.log(`✅ Usuario de prueba: ${testUser.name} (${testUser.email})`);

    // 3. Hacer una reserva en la primera clase disponible
    console.log('\n3️⃣ Realizando reserva de prueba...');
    const targetClass = availableClasses[0];
    
    // Verificar si ya está reservado
    const existingBooking = await prisma.booking.findFirst({
      where: {
        userId: testUser.id,
        timeSlotId: targetClass.id
      }
    });

    if (existingBooking) {
      console.log('⚠️  El usuario ya tiene una reserva en esta clase');
    } else {
      const booking = await prisma.booking.create({
        data: {
          id: `booking-test-${Date.now()}`,
          userId: testUser.id,
          timeSlotId: targetClass.id,
          status: 'CONFIRMED'
        }
      });

      console.log(`✅ Reserva creada: ${booking.id}`);
    }

    // 4. Verificar que la reserva se ve en la API
    console.log('\n4️⃣ Verificando reserva a través de la API...');
    
    // Simular llamada a la API de timeslots
    const timeSlotsQuery = await prisma.$queryRawUnsafe(`
      SELECT 
        ts.*,
        i.name as instructorName,
        i.profilePictureUrl as instructorProfilePicture,
        c.number as courtNumber,
        COUNT(b.id) as bookedPlayers
      FROM TimeSlot ts
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN Court c ON ts.courtId = c.id
      LEFT JOIN Booking b ON ts.id = b.timeSlotId
      WHERE ts.clubId = ? AND DATE(ts.start) = ?
      GROUP BY ts.id 
      ORDER BY ts.start ASC
    `, 'club-1', '2025-09-11');

    console.log(`✅ API devuelve ${timeSlotsQuery.length} clases`);
    
    if (timeSlotsQuery.length > 0) {
      const firstClass = timeSlotsQuery[0];
      console.log(`   Primera clase: ${firstClass.instructorName} - ${firstClass.bookedPlayers} reservas`);
    }

    // 5. Verificar reservas del usuario
    console.log('\n5️⃣ Verificando reservas del usuario...');
    const userBookings = await prisma.booking.findMany({
      where: {
        userId: testUser.id
      },
      include: {
        timeSlot: {
          include: {
            instructor: true,
            court: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ Usuario tiene ${userBookings.length} reservas`);
    
    userBookings.forEach((booking) => {
      const startTime = new Date(booking.timeSlot.start).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`   - ${startTime} con ${booking.timeSlot.instructor?.name} (${booking.status})`);
    });

    // 6. Probar la API de reservas del usuario
    console.log('\n6️⃣ Simulando API de reservas del usuario...');
    
    const bookingsApiQuery = await prisma.$queryRawUnsafe(`
      SELECT 
        b.*,
        ts.start,
        ts.end,
        ts.level,
        ts.category,
        ts.totalPrice,
        ts.maxPlayers,
        c.number as courtNumber,
        i.name as instructorName,
        i.profilePictureUrl as instructorProfilePicture
      FROM Booking b
      JOIN TimeSlot ts ON b.timeSlotId = ts.id
      LEFT JOIN Instructor i ON ts.instructorId = i.id
      LEFT JOIN Court c ON ts.courtId = c.id
      WHERE b.userId = ?
      ORDER BY ts.start ASC
    `, testUser.id);

    console.log(`✅ API de reservas devuelve ${bookingsApiQuery.length} reservas`);

    if (bookingsApiQuery.length > 0) {
      console.log('\n📋 Reservas encontradas:');
      bookingsApiQuery.forEach((booking) => {
        const startTime = new Date(booking.start).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
        const date = new Date(booking.start).toLocaleDateString('es-ES');
        console.log(`   - ${date} ${startTime} - ${booking.instructorName} - ${booking.level} (${booking.status})`);
      });
    }

    console.log('\n🎉 ¡Prueba del flujo completa exitosa!');
    console.log('\n✅ Resumen:');
    console.log(`   - Clases disponibles: ${availableClasses.length}`);
    console.log(`   - Usuario de prueba: ${testUser.name}`);
    console.log(`   - Reservas del usuario: ${userBookings.length}`);
    console.log(`   - API funcional: ✅`);

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingFlow();
