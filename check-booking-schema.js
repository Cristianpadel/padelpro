const { PrismaClient } = require('@prisma/client');

async function checkBookingSchema() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando bookings existentes...');
    
    // Obtener algunas reservas para ver la estructura
    const bookings = await prisma.booking.findMany({
      take: 3,
      include: {
        user: {
          select: {
            name: true,
            profilePictureUrl: true
          }
        }
      }
    });
    
    console.log('📋 Bookings encontrados:', bookings.length);
    
    if (bookings.length > 0) {
      console.log('📄 Estructura de un booking:');
      console.log(JSON.stringify(bookings[0], null, 2));
    }
    
    // Verificar si hay bookings con timeSlotId específico
    const specificBookings = await prisma.booking.findMany({
      where: {
        timeSlotId: 'class-2025-09-14-18-inst-1'
      },
      include: {
        user: true
      }
    });
    
    console.log('🎯 Bookings para class-2025-09-14-18-inst-1:', specificBookings.length);
    specificBookings.forEach(booking => {
      console.log(`- Usuario: ${booking.user.name}, timeSlotId: ${booking.timeSlotId}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookingSchema();