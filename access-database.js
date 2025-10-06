const { PrismaClient } = require('@prisma/client');

async function accessDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 ACCESO A LA BASE DE DATOS - PADEL PRO');
    console.log('═'.repeat(50));
    
    // 1. Mostrar todos los usuarios
    console.log('\n👥 USUARIOS REGISTRADOS:');
    const users = await prisma.user.findMany();
    users.forEach(user => {
      console.log(`  ${user.role === 'INSTRUCTOR' ? '👨‍🏫' : user.role === 'PLAYER' ? '🏓' : '👑'} ${user.name}`);
      console.log(`     📧 ${user.email}`);
      console.log(`     📊 Nivel: ${user.level} | Role: ${user.role}`);
      console.log(`     💰 Créditos: ${user.credits}`);
      console.log('');
    });
    
    // 2. Mostrar clubes
    console.log('\n🏢 CLUBES:');
    const clubs = await prisma.club.findMany();
    clubs.forEach(club => {
      console.log(`  🏟️  ${club.name}`);
      console.log(`     📍 ${club.address}`);
      console.log(`     📞 ${club.phone}`);
      console.log(`     📧 ${club.email}`);
      console.log('');
    });
    
    // 3. Mostrar pistas
    console.log('\n🎾 PISTAS:');
    const courts = await prisma.court.findMany({
      include: { club: true }
    });
    courts.forEach(court => {
      console.log(`  🎯 ${court.name}`);
      console.log(`     🏢 Club: ${court.club.name}`);
      console.log(`     ✅ Estado: ${court.isActive ? 'Activa' : 'Inactiva'}`);
      console.log('');
    });
    
    // 4. Mostrar instructores
    console.log('\n👨‍🏫 INSTRUCTORES:');
    const instructors = await prisma.instructor.findMany({
      include: { club: true }
    });
    instructors.forEach(instructor => {
      console.log(`  🥇 Instructor ID: ${instructor.id}`);
      console.log(`     🏢 Club: ${instructor.club.name}`);
      console.log(`     🎯 Especialidades: ${instructor.specialties}`);
      console.log(`     ⏱️  Experiencia: ${instructor.experience}`);
      console.log(`     ✅ Estado: ${instructor.isActive ? 'Activo' : 'Inactivo'}`);
      console.log('');
    });
    
    // 5. Mostrar clases programadas
    console.log('\n📅 CLASES PROGRAMADAS:');
    const timeSlots = await prisma.timeSlot.findMany({
      include: {
        club: true,
        court: true,
        bookings: {
          include: {
            user: true
          }
        }
      }
    });
    timeSlots.forEach(slot => {
      console.log(`  🕐 ${slot.date} de ${slot.startTime} a ${slot.endTime}`);
      console.log(`     🎾 Pista: ${slot.court.name}`);
      console.log(`     📊 Nivel: ${slot.level} | Tipo: ${slot.classType}`);
      console.log(`     👥 Capacidad: ${slot.maxParticipants} | Precio: €${slot.price}`);
      console.log(`     📝 Reservas: ${slot.bookings.length}/${slot.maxParticipants}`);
      if (slot.bookings.length > 0) {
        slot.bookings.forEach(booking => {
          console.log(`        - ${booking.user.name} (${booking.status})`);
        });
      }
      console.log('');
    });
    
    // 6. Mostrar reservas
    console.log('\n📋 RESERVAS:');
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        timeSlot: {
          include: {
            court: true
          }
        }
      }
    });
    bookings.forEach(booking => {
      console.log(`  📅 ${booking.user.name} → ${booking.timeSlot.date} ${booking.timeSlot.startTime}`);
      console.log(`     🎾 Pista: ${booking.timeSlot.court.name}`);
      console.log(`     👥 Grupo: ${booking.groupSize} persona(s)`);
      console.log(`     📊 Estado: ${booking.status}`);
      console.log('');
    });
    
    console.log('═'.repeat(50));
    console.log('✅ Acceso completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error accediendo a la base de datos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

accessDatabase();