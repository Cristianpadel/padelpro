const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkAvailableClasses() {
  try {
    console.log('📊 Verificando estado de las clases...');
    
    const classes = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: new Date('2025-09-11T00:00:00.000Z'),
          lt: new Date('2025-09-12T00:00:00.000Z')
        }
      },
      include: {
        instructor: true,
        bookings: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        start: 'asc'
      }
    });
    
    console.log(`\n📅 ${classes.length} clases para hoy:`);
    
    classes.forEach(cls => {
      const startTime = new Date(cls.start).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      console.log(`\n🕐 ${startTime} - ${cls.instructor?.name || 'Sin instructor'}`);
      console.log(`   ID: ${cls.id}`);
      console.log(`   Reservas: ${cls.bookings.length}/${cls.maxPlayers}`);
      
      if (cls.bookings.length > 0) {
        cls.bookings.forEach(booking => {
          console.log(`   - ${booking.user.name} (${booking.user.id})`);
        });
      } else {
        console.log(`   🆓 DISPONIBLE PARA RESERVAR`);
      }
    });
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAvailableClasses();
