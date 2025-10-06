const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClassesAndBookings() {
  try {
    console.log('🔍 Verificando estado actual de clases y reservas...\n');
    
    // Verificar TimeSlots (clases disponibles)
    const timeSlots = await prisma.timeSlot.count();
    console.log(`📅 Total de clases (TimeSlots): ${timeSlots}`);
    
    if (timeSlots > 0) {
      const sampleTimeSlots = await prisma.timeSlot.findMany({
        take: 3,
        include: {
          instructor: {
            select: { name: true }
          },
          court: {
            select: { number: true }
          }
        }
      });
      
      console.log('\n📋 Ejemplo de clases disponibles:');
      sampleTimeSlots.forEach((slot, index) => {
        console.log(`  ${index + 1}. ID: ${slot.id}`);
        console.log(`     📅 Horario: ${slot.start} - ${slot.end}`);
        console.log(`     👨‍🏫 Instructor: ${slot.instructor?.name || 'Sin instructor'}`);
        console.log(`     🏟️ Pista: ${slot.court?.number || 'Sin pista'}`);
        console.log(`     👥 Max jugadores: ${slot.maxPlayers}`);
        console.log(`     💰 Precio: €${slot.totalPrice}`);
        console.log('');
      });
    }
    
    // Verificar Bookings (reservas)
    const bookings = await prisma.booking.count();
    console.log(`📋 Total de reservas (Bookings): ${bookings}`);
    
    // Verificar Users
    const users = await prisma.user.count();
    console.log(`👥 Total de usuarios: ${users}`);
    
    // Verificar Instructors
    const instructors = await prisma.instructor.count();
    console.log(`👨‍🏫 Total de instructores: ${instructors}`);
    
    // Verificar Courts
    const courts = await prisma.court.count();
    console.log(`🏟️ Total de pistas: ${courts}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassesAndBookings();