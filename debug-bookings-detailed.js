const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkBookings() {
  try {
    console.log('🔍 Verificando bookings en la base de datos...');
    
    const bookings = await prisma.booking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profilePictureUrl: true,
          },
        },
        timeSlot: {
          include: {
            instructor: {
              select: {
                name: true,
                profilePictureUrl: true,
              },
            },
            court: {
              select: {
                number: true,
              },
            },
            _count: {
              select: {
                bookings: {
                  where: {
                    status: {
                      not: 'CANCELLED'
                    }
                  }
                }
              }
            }
          },
        },
      },
    });

    console.log(`📊 Total bookings encontrados: ${bookings.length}`);
    
    bookings.forEach((booking, index) => {
      console.log(`\n📋 Booking ${index + 1}:`);
      console.log(`  - ID: ${booking.id}`);
      console.log(`  - Usuario: ${booking.user.name}`);
      console.log(`  - GroupSize: ${booking.groupSize}`);
      console.log(`  - Status: ${booking.status}`);
      console.log(`  - TimeSlot ID: ${booking.timeSlotId}`);
      console.log(`  - Clase Start: ${booking.timeSlot.start}`);
      console.log(`  - Max Players: ${booking.timeSlot.maxPlayers}`);
      console.log(`  - Total Bookings en esta clase: ${booking.timeSlot._count.bookings}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBookings();