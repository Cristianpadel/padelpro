const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClassesToday() {
  try {
    console.log('📅 Verificando clases para hoy (2025-09-14)...\n');

    // Buscar todas las clases para hoy
    const todayClasses = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: new Date('2025-09-14T00:00:00Z'),
          lte: new Date('2025-09-14T23:59:59Z')
        }
      },
      include: {
        instructor: true,
        court: true,
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

    if (todayClasses.length === 0) {
      console.log('❌ No se encontraron clases para hoy');
      return;
    }

    console.log(`✅ Se encontraron ${todayClasses.length} clases para hoy:\n`);

    todayClasses.forEach((cls, index) => {
      const startTime = new Date(cls.start).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTime = new Date(cls.end).toLocaleString('es-ES', {
        timeZone: 'Europe/Madrid',
        hour: '2-digit',
        minute: '2-digit'
      });

      console.log(`${index + 1}. 🎾 CLASE #${cls.id}`);
      console.log(`   ⏰ Horario: ${startTime} - ${endTime}`);
      console.log(`   👨‍🏫 Instructor: ${cls.instructor?.name || 'Sin asignar'}`);
      console.log(`   🏟️ Pista: ${cls.court?.name || 'Sin asignar'}`);
      console.log(`   📊 Nivel: ${cls.level}`);
      console.log(`   👥 Categoría: ${cls.category}`);
      console.log(`   💰 Precio: €${cls.totalPrice}`);
      console.log(`   👥 Reservas: ${cls.bookings.length}/${cls.maxPlayers}`);
      
      if (cls.bookings.length > 0) {
        console.log(`   📝 Jugadores reservados:`);
        cls.bookings.forEach(booking => {
          console.log(`      - ${booking.user?.name || 'Usuario sin nombre'} (${booking.user?.email})`);
        });
      }
      console.log('');
    });

    // Estadísticas generales
    const totalBookings = todayClasses.reduce((sum, cls) => sum + cls.bookings.length, 0);
    const totalCapacity = todayClasses.reduce((sum, cls) => sum + cls.maxPlayers, 0);
    const occupancyRate = totalCapacity > 0 ? (totalBookings / totalCapacity * 100).toFixed(1) : 0;

    console.log('📊 ESTADÍSTICAS DEL DÍA:');
    console.log(`   • Total clases: ${todayClasses.length}`);
    console.log(`   • Total reservas: ${totalBookings}`);
    console.log(`   • Capacidad total: ${totalCapacity} jugadores`);
    console.log(`   • Ocupación: ${occupancyRate}%`);

  } catch (error) {
    console.error('❌ Error al verificar las clases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassesToday();