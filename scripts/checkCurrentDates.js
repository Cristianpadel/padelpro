const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentDates() {
  try {
    console.log('Verificando fechas actuales en TimeSlot...');
    
    // Obtener todas las fechas únicas
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1'
      },
      select: {
        id: true,
        start: true
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`Total time slots: ${timeSlots.length}`);

    // Agrupar por fecha
    const dateGroups = {};
    timeSlots.forEach(slot => {
      const date = new Date(slot.start).toISOString().split('T')[0];
      if (!dateGroups[date]) {
        dateGroups[date] = [];
      }
      dateGroups[date].push(slot);
    });

    console.log('\nFechas disponibles:');
    Object.keys(dateGroups).forEach(date => {
      console.log(`${date}: ${dateGroups[date].length} slots`);
    });

    console.log('\nPrimeras 5 slots por fecha:');
    Object.keys(dateGroups).slice(0, 3).forEach(date => {
      console.log(`\n--- ${date} ---`);
      dateGroups[date].slice(0, 5).forEach(slot => {
        console.log(`ID: ${slot.id}, Start: ${slot.start}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentDates();
