const { PrismaClient } = require('@prisma/client');

async function simpleAccess() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔐 ACCESO RÁPIDO A LA BASE DE DATOS');
    console.log('═'.repeat(50));
    
    // 1. Contar registros por tabla
    const userCount = await prisma.user.count();
    const clubCount = await prisma.club.count();
    const courtCount = await prisma.court.count();
    const instructorCount = await prisma.instructor.count();
    const timeSlotCount = await prisma.timeSlot.count();
    const bookingCount = await prisma.booking.count();
    
    console.log('\n📊 RESUMEN DE DATOS:');
    console.log(`  👥 Usuarios: ${userCount}`);
    console.log(`  🏢 Clubes: ${clubCount}`);
    console.log(`  🎾 Pistas: ${courtCount}`);
    console.log(`  👨‍🏫 Instructores: ${instructorCount}`);
    console.log(`  📅 Clases: ${timeSlotCount}`);
    console.log(`  📋 Reservas: ${bookingCount}`);
    
    // 2. Mostrar usuarios
    console.log('\n👥 TODOS LOS USUARIOS:');
    const users = await prisma.user.findMany();
    users.forEach(user => {
      const icon = user.role === 'INSTRUCTOR' ? '👨‍🏫' : user.role === 'PLAYER' ? '🏓' : '👑';
      console.log(`  ${icon} ${user.name} (${user.email})`);
      console.log(`      📊 ${user.level} | 💰 ${user.credits} créditos | Role: ${user.role}`);
    });
    
    // 3. Mostrar clubes
    console.log('\n🏢 CLUBES:');
    const clubs = await prisma.club.findMany();
    clubs.forEach(club => {
      console.log(`  🏟️  ${club.name}`);
      console.log(`      📍 ${club.address}`);
      console.log(`      📧 ${club.email} | 📞 ${club.phone}`);
    });
    
    // 4. Mostrar pistas
    console.log('\n🎾 PISTAS:');
    const courts = await prisma.court.findMany();
    courts.forEach(court => {
      console.log(`  🎯 ${court.name} (${court.isActive ? '✅ Activa' : '❌ Inactiva'})`);
    });
    
    // 5. Mostrar clases
    console.log('\n📅 CLASES PROGRAMADAS:');
    const timeSlots = await prisma.timeSlot.findMany();
    timeSlots.forEach(slot => {
      console.log(`  🕐 ${slot.date} ${slot.startTime}-${slot.endTime}`);
      console.log(`      📊 ${slot.level} | 💰 €${slot.price} | 👥 Max: ${slot.maxParticipants}`);
    });
    
    // 6. Mostrar reservas
    console.log('\n📋 RESERVAS:');
    const bookings = await prisma.booking.findMany();
    bookings.forEach(booking => {
      console.log(`  📅 Booking: ${booking.id}`);
      console.log(`      👤 User: ${booking.userId} → 🕐 Clase: ${booking.timeSlotId}`);
      console.log(`      📊 Estado: ${booking.status} | 👥 Grupo: ${booking.groupSize}`);
    });
    
    console.log('\n═'.repeat(50));
    console.log('✅ BASE DE DATOS ACCESIBLE - Datos disponibles');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

simpleAccess();