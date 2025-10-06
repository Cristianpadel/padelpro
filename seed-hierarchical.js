const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with hierarchical structure...');

  // 1. Crear administradores
  const superAdmin = await prisma.admin.create({
    data: {
      email: 'admin@padelpro.com',
      name: 'Super Administrador',
      role: 'SUPER_ADMIN',
      phone: '+34 600 000 001'
    }
  });

  const clubAdmin = await prisma.admin.create({
    data: {
      email: 'club.admin@padelpro.com',
      name: 'Administrador de Club',
      role: 'CLUB_ADMIN',
      phone: '+34 600 000 002'
    }
  });

  console.log('✅ Administradores creados');

  // 2. Crear clubes asociados a administradores
  const club1 = await prisma.club.create({
    data: {
      name: 'Club de Padel Madrid Centro',
      address: 'Calle Gran Vía 123, Madrid',
      phone: '+34 91 123 4567',
      email: 'info@clubmadrid.com',
      website: 'https://clubmadrid.com',
      description: 'El mejor club de padel en el centro de Madrid',
      adminId: superAdmin.id
    }
  });

  const club2 = await prisma.club.create({
    data: {
      name: 'Padel Club Barcelona',
      address: 'Passeig de Gràcia 456, Barcelona',
      phone: '+34 93 987 6543',
      email: 'info@clubbcn.com',
      website: 'https://clubbcn.com',
      description: 'Club de padel premium en Barcelona',
      adminId: clubAdmin.id
    }
  });

  console.log('✅ Clubes creados');

  // 3. Crear canchas para cada club
  const court1 = await prisma.court.create({
    data: {
      number: 1,
      name: 'Cancha Central',
      clubId: club1.id
    }
  });

  const court2 = await prisma.court.create({
    data: {
      number: 2,
      name: 'Cancha VIP',
      clubId: club1.id
    }
  });

  const court3 = await prisma.court.create({
    data: {
      number: 1,
      name: 'Cancha Premium',
      clubId: club2.id
    }
  });

  console.log('✅ Canchas creadas');

  // 4. Crear usuarios asociados a clubes
  const user1 = await prisma.user.create({
    data: {
      email: 'jugador1@gmail.com',
      name: 'Carlos Rodríguez',
      level: 'intermedio',
      role: 'PLAYER',
      clubId: club1.id,
      credits: 10
    }
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jugador2@gmail.com',
      name: 'María González',
      level: 'avanzado',
      role: 'PLAYER',
      clubId: club1.id,
      credits: 15
    }
  });

  const user3 = await prisma.user.create({
    data: {
      email: 'jugador3@gmail.com',
      name: 'Juan Martínez',
      level: 'principiante',
      role: 'PLAYER',
      clubId: club2.id,
      credits: 5
    }
  });

  // Usuario que será instructor
  const instructorUser = await prisma.user.create({
    data: {
      email: 'instructor@gmail.com',
      name: 'Pedro López',
      level: 'profesional',
      role: 'INSTRUCTOR',
      clubId: club1.id,
      credits: 0
    }
  });

  console.log('✅ Usuarios creados');

  // 5. Crear instructores asociados a clubes
  const instructor1 = await prisma.instructor.create({
    data: {
      userId: instructorUser.id,
      name: 'Pedro López',
      specialties: 'Padel, Tenis, Fitness',
      experience: '5 años como instructor profesional',
      hourlyRate: 45.0,
      clubId: club1.id
    }
  });

  console.log('✅ Instructores creados');

  // 6. Crear clases (TimeSlots) asociadas a clubes e instructores
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  const endTime = new Date(tomorrow);
  endTime.setHours(11, 0, 0, 0);

  const timeSlot1 = await prisma.timeSlot.create({
    data: {
      clubId: club1.id,
      courtId: court1.id,
      instructorId: instructor1.id,
      start: tomorrow,
      end: endTime,
      maxPlayers: 4,
      totalPrice: 60.0,
      level: 'intermedio',
      category: 'Clase grupal'
    }
  });

  console.log('✅ Clases creadas');

  // 7. Crear reservas
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      timeSlotId: timeSlot1.id,
      status: 'CONFIRMED'
    }
  });

  console.log('✅ Reservas creadas');

  console.log('\n🎉 Database seeded successfully with hierarchical structure!');
  console.log('\nStructure created:');
  console.log('👑 Super Admin → Club Madrid Centro → Users + Instructor + Classes');
  console.log('👑 Club Admin → Club Barcelona → Users');
  console.log('\nHierarchy:');
  console.log('- Admin controls Clubs');
  console.log('- Club contains Users and Instructors');
  console.log('- Classes belong to specific Club + Instructor');
  console.log('- Bookings link Users to Classes within same Club');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });