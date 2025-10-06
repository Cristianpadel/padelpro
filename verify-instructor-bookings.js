const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyInstructorBookings() {
  try {
    console.log('🔍 Verificando bookings con información de instructores...\n');
    
    // Obtener algunos bookings con su información completa
    const bookings = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED'
      },
      take: 5,
      include: {
        user: true,
        timeSlot: {
          include: {
            instructor: {
              include: {
                user: true
              }
            },
            court: true
          }
        }
      }
    });
    
    console.log(`📋 Mostrando ${bookings.length} bookings confirmados:\n`);
    
    bookings.forEach((booking, index) => {
      console.log(`${index + 1}. Booking ID: ${booking.id}`);
      console.log(`   Usuario: ${booking.user.name}`);
      console.log(`   Foto Usuario: ${booking.user.profilePictureUrl || 'Sin foto'}`);
      console.log(`   Instructor: ${booking.timeSlot.instructor?.user.name || 'N/A'}`);
      console.log(`   Foto Instructor: ${booking.timeSlot.instructor?.user.profilePictureUrl || 'Sin foto'}`);
      console.log(`   Clase: ${new Date(booking.timeSlot.start).toLocaleString()}`);
      console.log(`   Pista: ${booking.timeSlot.court?.number || 'N/A'}`);
      console.log('');
    });
    
    console.log('✅ Verificación completada!');
    console.log('\n💡 Las tarjetas de AdminBookingCard ahora mostrarán:');
    console.log('   - Foto del instructor con ring morado');
    console.log('   - Badge "👨‍🏫 Instructor" junto al nombre');
    console.log('   - Fotos de usuarios en los círculos de reserva');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyInstructorBookings();
