const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createClassesToday() {
  try {
    console.log('🎯 Creando clases para hoy (2025-09-14)...');

    // Fecha de hoy
    const today = '2025-09-14';

    // Clases para crear
    const classesToCreate = [
      {
        id: `class-${today}-08-inst-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-1',
        start: new Date('2025-09-14T08:00:00Z'),
        end: new Date('2025-09-14T09:30:00Z'),
        maxPlayers: 4,
        totalPrice: 45,
        level: 'principiante',
        category: 'abierta'
      },
      {
        id: `class-${today}-10-inst-2`,
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'instructor-2',
        start: new Date('2025-09-14T10:00:00Z'),
        end: new Date('2025-09-14T11:30:00Z'),
        maxPlayers: 4,
        totalPrice: 50,
        level: 'intermedio',
        category: 'abierta'
      },
      {
        id: `class-${today}-14-inst-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-1',
        start: new Date('2025-09-14T14:00:00Z'),
        end: new Date('2025-09-14T15:30:00Z'),
        maxPlayers: 4,
        totalPrice: 55,
        level: 'avanzado',
        category: 'femenina'
      },
      {
        id: `class-${today}-16-inst-2`,
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'instructor-2',
        start: new Date('2025-09-14T16:00:00Z'),
        end: new Date('2025-09-14T17:30:00Z'),
        maxPlayers: 4,
        totalPrice: 60,
        level: 'intermedio',
        category: 'masculina'
      },
      {
        id: `class-${today}-18-inst-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'instructor-1',
        start: new Date('2025-09-14T18:00:00Z'),
        end: new Date('2025-09-14T19:30:00Z'),
        maxPlayers: 4,
        totalPrice: 65,
        level: 'avanzado',
        category: 'abierta'
      }
    ];

    let created = 0;

    for (const classData of classesToCreate) {
      try {
        await prisma.timeSlot.create({
          data: classData
        });
        console.log(`✅ Clase creada: ${classData.id} - ${classData.start.toISOString()} (${classData.level})`);
        created++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Clase ya existe: ${classData.id}`);
        } else {
          console.error(`❌ Error creando ${classData.id}:`, error.message);
        }
      }
    }

    console.log(`\n🎉 Proceso completado: ${created} clases creadas para ${today}`);

    // Verificar el resultado
    const todayClasses = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1',
        start: {
          gte: new Date('2025-09-14T00:00:00Z'),
          lte: new Date('2025-09-14T23:59:59Z')
        }
      },
      include: {
        instructor: true,
        court: true,
        bookings: true
      },
      orderBy: {
        start: 'asc'
      }
    });

    console.log(`\n📊 Resumen: ${todayClasses.length} clases disponibles para hoy:`);
    
    todayClasses.forEach(cls => {
      const startTime = new Date(cls.start).toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      console.log(`   ${startTime} - ${cls.instructor?.name || 'Sin instructor'} - ${cls.level} - ${cls.bookings.length}/${cls.maxPlayers} reservas`);
    });

  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createClassesToday();
