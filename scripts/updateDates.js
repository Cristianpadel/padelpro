const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateDates() {
  try {
    console.log('Actualizando fechas a fechas más actuales...');
    
    // Obtener todas las TimeSlots
    const timeSlots = await prisma.timeSlot.findMany({
      select: {
        id: true,
        start: true,
        end: true
      }
    });

    console.log(`Encontrados ${timeSlots.length} time slots para actualizar`);

    // Calcular fechas a partir de hoy
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 1); // Empezar desde ayer

    let dayOffset = 0;
    const slotsPerDay = 14; // Asumiendo 14 slots por día

    for (let i = 0; i < timeSlots.length; i++) {
      const slot = timeSlots[i];
      
      // Calcular el día y hora
      if (i > 0 && i % slotsPerDay === 0) {
        dayOffset++;
      }
      
      const slotInDay = i % slotsPerDay;
      const hour = 8 + slotInDay; // Empezar a las 8:00 AM
      
      const newDate = new Date(startDate);
      newDate.setDate(startDate.getDate() + dayOffset);
      newDate.setHours(hour, 0, 0, 0);
      
      const newEnd = new Date(newDate);
      newEnd.setHours(hour + 1, 0, 0, 0);

      // Actualizar el slot
      await prisma.timeSlot.update({
        where: { id: slot.id },
        data: {
          start: newDate,
          end: newEnd
        }
      });

      if (i < 5) {
        console.log(`Slot ${slot.id}: ${newDate.toISOString()} -> ${newEnd.toISOString()}`);
      }
    }

    console.log('Fechas actualizadas exitosamente');

    // Verificar algunos slots actualizados
    const updated = await prisma.timeSlot.findMany({
      take: 5,
      select: {
        id: true,
        start: true,
        end: true
      }
    });

    console.log('\nPrimeros 5 slots actualizados:');
    updated.forEach(slot => {
      const date = new Date(slot.start);
      console.log(`ID: ${slot.id}, Start: ${date.toISOString()}, Date: ${date.toISOString().split('T')[0]}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDates();
