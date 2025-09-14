// Script to add more classes using proper Prisma client
const { PrismaClient } = require('@prisma/client');

async function addClassesForMultipleDays() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Agregando clases para múltiples días...');

    // Definir clases para diferentes días
    const classesToCreate = [
      // Día 8 (2025-09-08)
      {
        id: 'ts-20250908-8-inst-1',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-1',
        start: new Date('2025-09-08T08:00:00Z'),
        end: new Date('2025-09-08T09:00:00Z'),
        maxPlayers: 4,
        totalPrice: 35,
        level: 'principiante',
        category: 'abierta'
      },
      {
        id: 'ts-20250908-9-inst-2',
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'inst-2',
        start: new Date('2025-09-08T09:00:00Z'),
        end: new Date('2025-09-08T10:00:00Z'),
        maxPlayers: 4,
        totalPrice: 40,
        level: 'intermedio',
        category: 'abierta'
      },
      {
        id: 'ts-20250908-16-inst-3',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-3',
        start: new Date('2025-09-08T16:00:00Z'),
        end: new Date('2025-09-08T17:00:00Z'),
        maxPlayers: 4,
        totalPrice: 45,
        level: 'avanzado',
        category: 'femenina'
      },

      // Día 9 (2025-09-09)
      {
        id: 'ts-20250909-8-inst-2',
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'inst-2',
        start: new Date('2025-09-09T08:00:00Z'),
        end: new Date('2025-09-09T09:00:00Z'),
        maxPlayers: 4,
        totalPrice: 35,
        level: 'principiante',
        category: 'abierta'
      },
      {
        id: 'ts-20250909-11-inst-4',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-4',
        start: new Date('2025-09-09T11:00:00Z'),
        end: new Date('2025-09-09T12:00:00Z'),
        maxPlayers: 4,
        totalPrice: 40,
        level: 'intermedio',
        category: 'masculina'
      },

      // Día 10 (2025-09-10)
      {
        id: 'ts-20250910-7-inst-1',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-1',
        start: new Date('2025-09-10T07:00:00Z'),
        end: new Date('2025-09-10T08:00:00Z'),
        maxPlayers: 4,
        totalPrice: 35,
        level: 'principiante',
        category: 'abierta'
      },
      {
        id: 'ts-20250910-15-inst-3',
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'inst-3',
        start: new Date('2025-09-10T15:00:00Z'),
        end: new Date('2025-09-10T16:00:00Z'),
        maxPlayers: 4,
        totalPrice: 45,
        level: 'avanzado',
        category: 'femenina'
      },
      {
        id: 'ts-20250910-17-inst-2',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-2',
        start: new Date('2025-09-10T17:00:00Z'),
        end: new Date('2025-09-10T18:00:00Z'),
        maxPlayers: 4,
        totalPrice: 40,
        level: 'intermedio',
        category: 'abierta'
      },

      // Día 11 (2025-09-11)
      {
        id: 'ts-20250911-9-inst-4',
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: 'inst-4',
        start: new Date('2025-09-11T09:00:00Z'),
        end: new Date('2025-09-11T10:00:00Z'),
        maxPlayers: 4,
        totalPrice: 35,
        level: 'principiante',
        category: 'masculina'
      },
      {
        id: 'ts-20250911-18-inst-1',
        clubId: 'club-1',
        courtId: 'court-2',
        instructorId: 'inst-1',
        start: new Date('2025-09-11T18:00:00Z'),
        end: new Date('2025-09-11T19:00:00Z'),
        maxPlayers: 4,
        totalPrice: 40,
        level: 'intermedio',
        category: 'abierta'
      }
    ];

    // Crear cada clase individualmente
    let created = 0;
    for (const classData of classesToCreate) {
      try {
        await prisma.timeSlot.create({
          data: classData
        });
        console.log(`✓ Clase creada: ${classData.id} para ${classData.start.toISOString().split('T')[0]}`);
        created++;
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠ Clase ya existe: ${classData.id}`);
        } else {
          console.error(`✗ Error creando ${classData.id}:`, error.message);
        }
      }
    }

    console.log(`\n✅ Proceso completado: ${created} nuevas clases creadas`);
    
    // Verificar qué tenemos ahora
    console.log('\n=== Resumen por fechas ===');
    const summary = await prisma.$queryRaw`
      SELECT 
        DATE(start) as fecha,
        COUNT(*) as total_clases,
        GROUP_CONCAT(id) as class_ids
      FROM TimeSlot 
      WHERE clubId = 'club-1' 
      GROUP BY DATE(start) 
      ORDER BY fecha
    `;
    
    summary.forEach(row => {
      console.log(`${row.fecha}: ${row.total_clases} clases (${row.class_ids})`);
    });
    
  } catch (error) {
    console.error('Error general:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addClassesForMultipleDays();
