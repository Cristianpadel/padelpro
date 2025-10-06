const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkClassDates() {
  try {
    console.log('🔍 Verificando fechas de clases en la base de datos...\n');

    // Obtener todas las clases con sus fechas
    const timeSlots = await prisma.timeSlot.findMany({
      select: {
        id: true,
        start: true,
        end: true,
        clubId: true,
        instructorId: true,
        maxPlayers: true,
        totalPrice: true
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`📊 Total de clases encontradas: ${timeSlots.length}\n`);

    if (timeSlots.length === 0) {
      console.log('❌ No hay clases en la base de datos');
      return;
    }

    // Agrupar por fecha
    const classesByDate = {};
    timeSlots.forEach(slot => {
      const date = slot.start.toISOString().split('T')[0];
      if (!classesByDate[date]) {
        classesByDate[date] = [];
      }
      classesByDate[date].push(slot);
    });

    console.log('📅 Clases agrupadas por fecha:\n');
    Object.keys(classesByDate).sort().forEach(date => {
      const classes = classesByDate[date];
      console.log(`📅 ${date}: ${classes.length} clases`);
      classes.forEach((cls, index) => {
        const startTime = cls.start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const endTime = cls.end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        console.log(`   ${index + 1}. ${startTime}-${endTime} | Max: ${cls.maxPlayers} | Precio: €${cls.totalPrice} | ID: ${cls.id.substring(0, 12)}...`);
      });
      console.log('');
    });

    // Verificar fecha de hoy
    const today = new Date('2025-09-25').toISOString().split('T')[0]; // Fecha actual según contexto
    console.log(`🗓️ Fecha de hoy: ${today}`);
    
    if (classesByDate[today]) {
      console.log(`✅ Hay ${classesByDate[today].length} clases para hoy`);
    } else {
      console.log(`❌ No hay clases para hoy`);
      
      // Buscar la fecha más cercana con clases
      const futureDates = Object.keys(classesByDate).filter(date => date >= today).sort();
      if (futureDates.length > 0) {
        console.log(`💡 La fecha más próxima con clases es: ${futureDates[0]} (${classesByDate[futureDates[0]].length} clases)`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkClassDates();