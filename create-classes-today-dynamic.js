const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createClassesForToday() {
  try {
    // Obtener fecha actual
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    console.log(`🎯 Creando clases para hoy: ${today}...`);

    // Eliminar clases existentes para hoy para evitar duplicados
    const deleteResult = await prisma.$executeRaw`
      DELETE FROM TimeSlot 
      WHERE DATE(start) = ${today} 
      AND clubId = 'club-1'
    `;
    console.log('🗑️ Clases eliminadas para hoy:', deleteResult);

    // Obtener el instructor existente
    const instructors = await prisma.$queryRaw`SELECT id FROM Instructor LIMIT 1`;
    const instructorId = instructors[0]?.id || 'cmfxhfr1i0004tg5gsrqviihq';
    
    // Clases para crear (con horarios de hoy)
    const classesToCreate = [
      {
        id: `class-${today}-09-inst-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: instructorId,
        start: `${today}T09:00:00Z`,
        end: `${today}T10:30:00Z`,
        maxPlayers: 4,
        totalPrice: 25,
        level: 'principiante',
        category: 'abierta'
      },
      {
        id: `class-${today}-11-inst-2`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: instructorId,
        start: `${today}T11:00:00Z`,
        end: `${today}T12:30:00Z`,
        maxPlayers: 4,
        totalPrice: 25,
        level: 'intermedio',
        category: 'mixta'
      },
      {
        id: `class-${today}-15-inst-1`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: instructorId,
        start: `${today}T15:00:00Z`,
        end: `${today}T16:30:00Z`,
        maxPlayers: 4,
        totalPrice: 25,
        level: 'avanzado',
        category: 'masculino'
      },
      {
        id: `class-${today}-17-inst-3`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: instructorId,
        start: `${today}T17:00:00Z`,
        end: `${today}T18:30:00Z`,
        maxPlayers: 4,
        totalPrice: 25,
        level: 'intermedio',
        category: 'femenino'
      },
      {
        id: `class-${today}-19-inst-2`,
        clubId: 'club-1',
        courtId: 'court-1',
        instructorId: instructorId,
        start: `${today}T19:00:00Z`,
        end: `${today}T20:30:00Z`,
        maxPlayers: 4,
        totalPrice: 25,
        level: 'principiante',
        category: 'abierta'
      }
    ];

    // Crear las clases una por una
    for (const classData of classesToCreate) {
      try {
        await prisma.$executeRaw`
          INSERT INTO TimeSlot (
            id, clubId, courtId, instructorId, start, end,
            maxPlayers, totalPrice, level, category, createdAt, updatedAt
          ) VALUES (
            ${classData.id},
            ${classData.clubId},
            ${classData.courtId},
            ${classData.instructorId},
            ${classData.start},
            ${classData.end},
            ${classData.maxPlayers},
            ${classData.totalPrice},
            ${classData.level},
            ${classData.category},
            datetime('now'),
            datetime('now')
          )
        `;
        
        console.log(`✅ Clase creada: ${classData.id} - ${classData.level} - ${classData.start.split('T')[1].split('Z')[0]}`);
      } catch (error) {
        console.error(`❌ Error creando clase ${classData.id}:`, error.message);
      }
    }

    console.log('🎉 Proceso completado!');
    console.log(`📅 Clases creadas para: ${today}`);
    
    // Verificar las clases creadas
    const createdClasses = await prisma.$queryRaw`
      SELECT id, start, end, level, category, totalPrice
      FROM TimeSlot 
      WHERE DATE(start) = ${today}
      AND clubId = 'club-1'
      ORDER BY start
    `;
    
    console.log('📋 Clases disponibles hoy:');
    for (const cls of createdClasses) {
      const startTime = new Date(cls.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(cls.end).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      console.log(`  - ${startTime} - ${endTime}: ${cls.level} (${cls.category}) - ${cls.totalPrice}€`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createClassesForToday();