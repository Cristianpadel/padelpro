// Script para agregar más clases en diferentes días
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addMoreClasses() {
  try {
    console.log('Agregando más clases para diferentes días...');

    // Fechas para agregar clases (próximos 10 días)
    const baseDates = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date('2025-09-07');
      date.setDate(date.getDate() + i);
      baseDates.push(date);
    }

    // Horarios base
    const timeSlots = [
      { hour: 8, minute: 0 },
      { hour: 9, minute: 0 },
      { hour: 10, minute: 0 },
      { hour: 11, minute: 0 },
      { hour: 12, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 14, minute: 0 },
      { hour: 15, minute: 0 },
      { hour: 16, minute: 0 },
      { hour: 17, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 19, minute: 0 },
      { hour: 20, minute: 0 },
      { hour: 21, minute: 0 }
    ];

    // Obtener instructores existentes
    const instructors = await prisma.instructor.findMany();
    if (instructors.length === 0) {
      console.log('No hay instructores. Creando instructores primero...');
      return;
    }

    // Niveles y categorías
    const levels = ['principiante', 'intermedio', 'avanzado'];
    const categories = ['abierta', 'femenino', 'masculino'];
    const precios = [35, 40, 45, 50];

    let classCount = 0;

    for (const baseDate of baseDates) {
      // Para cada día, crear entre 8-12 clases
      const classesForDay = Math.floor(Math.random() * 5) + 8; // 8-12 clases
      
      for (let i = 0; i < classesForDay; i++) {
        const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
        const instructor = instructors[Math.floor(Math.random() * instructors.length)];
        
        const startTime = new Date(baseDate);
        startTime.setHours(timeSlot.hour, timeSlot.minute, 0, 0);
        
        const endTime = new Date(startTime);
        endTime.setHours(startTime.getHours() + 1); // 1 hora de duración

        // Verificar que no existe ya una clase en este horario para este instructor
        const existing = await prisma.timeSlot.findFirst({
          where: {
            instructorId: instructor.id,
            start: startTime
          }
        });

        if (!existing) {
          await prisma.timeSlot.create({
            data: {
              clubId: 'club-1',
              instructorId: instructor.id,
              start: startTime,
              end: endTime,
              maxPlayers: 4,
              level: levels[Math.floor(Math.random() * levels.length)],
              category: categories[Math.floor(Math.random() * categories.length)],
              totalPrice: precios[Math.floor(Math.random() * precios.length)]
            }
          });
          classCount++;
        }
      }
    }

    console.log(`✅ Agregadas ${classCount} clases nuevas para ${baseDates.length} días`);
    console.log(`📅 Fechas: ${baseDates[0].toDateString()} a ${baseDates[baseDates.length-1].toDateString()}`);

  } catch (error) {
    console.error('Error agregando clases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreClasses();
