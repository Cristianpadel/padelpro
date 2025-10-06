const { PrismaClient } = require('@prisma/client');

async function seedDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Iniciando seed de la base de datos...\n');
    
    // 1. Crear clubes
    console.log('🏢 Creando clubes...');
    const club1 = await prisma.club.create({
      data: {
        id: 'club-1',
        name: 'Padel Estrella',
        address: 'Calle Principal 123, Madrid',
        phone: '+34 91 123 4567',
        email: 'info@padelestrella.com',
        description: 'El mejor club de pádel de Madrid',
        updatedAt: new Date()
      }
    });
    console.log(`✅ Club creado: ${club1.name}`);
    
    // 2. Crear pistas
    console.log('\n🎾 Creando pistas...');
    const court1 = await prisma.court.create({
      data: {
        id: 'court-1',
        name: 'Pista Central',
        clubId: 'club-1',
        isActive: true,
        updatedAt: new Date()
      }
    });
    
    const court2 = await prisma.court.create({
      data: {
        id: 'court-2',
        name: 'Pista 2',
        clubId: 'club-1',
        isActive: true,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Pistas creadas: ${court1.name}, ${court2.name}`);
    
    // 3. Crear usuarios
    console.log('\n👥 Creando usuarios...');
    const users = [
      {
        id: 'user-1',
        email: 'alex@example.com',
        name: 'Alex García',
        level: '4.0',
        role: 'PLAYER',
        clubId: 'club-1',
        credits: 100,
        updatedAt: new Date()
      },
      {
        id: 'user-2',
        email: 'maria@example.com', 
        name: 'María López',
        level: '3.5',
        role: 'PLAYER',
        clubId: 'club-1',
        credits: 150,
        updatedAt: new Date()
      },
      {
        id: 'instructor-1',
        email: 'carlos@example.com',
        name: 'Carlos Instructor',
        level: '6.0',
        role: 'INSTRUCTOR',
        clubId: 'club-1',
        credits: 0,
        updatedAt: new Date()
      }
    ];
    
    for (const userData of users) {
      const user = await prisma.user.create({ data: userData });
      console.log(`✅ Usuario creado: ${user.name} (${user.role})`);
    }
    
    // 4. Crear instructor
    console.log('\n👨‍🏫 Creando instructor...');
    const instructor = await prisma.instructor.create({
      data: {
        id: 'inst-1',
        userId: 'instructor-1',
        specialties: 'Principiantes, Técnica avanzada',
        experience: '5 años de experiencia',
        clubId: 'club-1',
        isActive: true,
        updatedAt: new Date()
      }
    });
    console.log(`✅ Instructor creado: instructor-1`);
    
    // 5. Crear time slots
    console.log('\n⏰ Creando time slots...');
    const timeSlots = [
      {
        id: 'ts-1',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-1',
        date: '2025-09-17',
        startTime: '09:00',
        endTime: '10:30',
        maxParticipants: 4,
        price: 25.0,
        level: 'principiante',
        classType: 'grupal',
        isActive: true,
        updatedAt: new Date()
      },
      {
        id: 'ts-2',
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'inst-1',
        date: '2025-09-17',
        startTime: '11:00',
        endTime: '12:30',
        maxParticipants: 4,
        price: 30.0,
        level: 'intermedio',
        classType: 'grupal',
        isActive: true,
        updatedAt: new Date()
      }
    ];
    
    for (const slotData of timeSlots) {
      const slot = await prisma.timeSlot.create({ data: slotData });
      console.log(`✅ Time slot creado: ${slot.date} ${slot.startTime}-${slot.endTime}`);
    }
    
    // 6. Crear bookings
    console.log('\n📅 Creando bookings...');
    const bookings = [
      {
        id: 'booking-1',
        userId: 'user-1',
        timeSlotId: 'ts-1',
        groupSize: 1,
        status: 'CONFIRMED',
        updatedAt: new Date()
      },
      {
        id: 'booking-2',
        userId: 'user-2',
        timeSlotId: 'ts-2',
        groupSize: 1,
        status: 'CONFIRMED',
        updatedAt: new Date()
      }
    ];
    
    for (const bookingData of bookings) {
      const booking = await prisma.booking.create({ data: bookingData });
      console.log(`✅ Booking creado: ${booking.id} (${booking.status})`);
    }
    
    console.log('\n🎉 ¡Seed completado exitosamente!');
    console.log('\n📊 RESUMEN:');
    console.log('  - 1 Club');
    console.log('  - 2 Pistas');
    console.log('  - 3 Usuarios (2 jugadores + 1 instructor)');
    console.log('  - 1 Instructor');
    console.log('  - 2 Time slots');
    console.log('  - 2 Bookings');
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase();