const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDates() {
  try {
    console.log('Verificando fechas en TimeSlot...');
    
    // Obtener algunos registros para ver el formato de fecha
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1'
      },
      take: 5,
      select: {
        id: true,
        start: true,
        clubId: true
      }
    });

    console.log('Primeros 5 registros:');
    timeSlots.forEach(slot => {
      const date = new Date(slot.start);
      console.log(`ID: ${slot.id}, Start: ${slot.start}, Date: ${date.toISOString().split('T')[0]}`);
    });

    // Buscar específicamente para 2025-09-11
    const specificDate = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1',
        start: {
          gte: new Date('2025-09-11T00:00:00.000Z'),
          lte: new Date('2025-09-11T23:59:59.999Z')
        }
      },
      select: {
        id: true,
        start: true
      }
    });

    console.log(`\nRegistros para 2025-09-11: ${specificDate.length}`);
    specificDate.forEach(slot => {
      console.log(`ID: ${slot.id}, Start: ${slot.start}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();
