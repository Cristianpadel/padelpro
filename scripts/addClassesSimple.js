const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addMoreClasses() {
  try {
    console.log('Agregando clases para diferentes días...');

    // Clases para el día 2025-09-08
    const classesDay8 = [
      {
        id: 'slot-108',
        startTime: '09:00',
        endTime: '10:30',
        maxCapacity: 8,
        currentBookings: 1,
        instructorId: 'instructor-1',
        courtId: 'court-1',
        price: 2500,
        level: 'Principiante',
        description: 'Clase de pádel para principiantes. Aprende los fundamentos del juego en un ambiente divertido.',
        classType: 'Clase Grupal',
        date: '2025-09-08'
      },
      {
        id: 'slot-109',
        startTime: '10:45',
        endTime: '12:15',
        maxCapacity: 8,
        currentBookings: 2,
        instructorId: 'instructor-2',
        courtId: 'court-2',
        price: 2500,
        level: 'Intermedio',
        description: 'Clase de pádel nivel intermedio. Mejora tu técnica y estrategia de juego.',
        classType: 'Clase Grupal',
        date: '2025-09-08'
      },
      {
        id: 'slot-110',
        startTime: '16:00',
        endTime: '17:30',
        maxCapacity: 8,
        currentBookings: 0,
        instructorId: 'instructor-3',
        courtId: 'court-1',
        price: 2500,
        level: 'Avanzado',
        description: 'Clase de pádel avanzado. Perfecciona tus golpes y tácticas.',
        classType: 'Clase Grupal',
        date: '2025-09-08'
      }
    ];

    // Clases para el día 2025-09-09
    const classesDay9 = [
      {
        id: 'slot-113',
        startTime: '08:00',
        endTime: '09:30',
        maxCapacity: 8,
        currentBookings: 2,
        instructorId: 'instructor-2',
        courtId: 'court-1',
        price: 2500,
        level: 'Principiante',
        description: 'Clase matutina para principiantes. Comienza el día con energía.',
        classType: 'Clase Grupal',
        date: '2025-09-09'
      },
      {
        id: 'slot-114',
        startTime: '11:00',
        endTime: '12:30',
        maxCapacity: 8,
        currentBookings: 1,
        instructorId: 'instructor-4',
        courtId: 'court-2',
        price: 2500,
        level: 'Intermedio',
        description: 'Perfecciona tu juego en esta clase de nivel intermedio.',
        classType: 'Clase Grupal',
        date: '2025-09-09'
      }
    ];

    // Clases para el día 2025-09-10
    const classesDay10 = [
      {
        id: 'slot-115',
        startTime: '07:30',
        endTime: '09:00',
        maxCapacity: 8,
        currentBookings: 3,
        instructorId: 'instructor-1',
        courtId: 'court-1',
        price: 2500,
        level: 'Todos los niveles',
        description: 'Clase temprana para todos los niveles. ¡Energiza tu mañana!',
        classType: 'Clase Grupal',
        date: '2025-09-10'
      },
      {
        id: 'slot-116',
        startTime: '15:30',
        endTime: '17:00',
        maxCapacity: 8,
        currentBookings: 0,
        instructorId: 'instructor-3',
        courtId: 'court-2',
        price: 2500,
        level: 'Avanzado',
        description: 'Entrenamiento avanzado. Lleva tu juego al siguiente nivel.',
        classType: 'Entrenamiento',
        date: '2025-09-10'
      },
      {
        id: 'slot-117',
        startTime: '17:15',
        endTime: '18:45',
        maxCapacity: 8,
        currentBookings: 2,
        instructorId: 'instructor-2',
        courtId: 'court-1',
        price: 2500,
        level: 'Intermedio',
        description: 'Clase vespertina nivel intermedio. Ideal para después del trabajo.',
        classType: 'Clase Grupal',
        date: '2025-09-10'
      }
    ];

    // Agregar todas las clases
    const allClasses = [...classesDay8, ...classesDay9, ...classesDay10];
    
    for (const classData of allClasses) {
      await prisma.timeSlot.create({
        data: classData
      });
      console.log(`✓ Clase agregada: ${classData.id} para ${classData.date}`);
    }

    console.log('✅ Todas las clases han sido agregadas exitosamente!');
    
  } catch (error) {
    console.error('Error agregando clases:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addMoreClasses();
