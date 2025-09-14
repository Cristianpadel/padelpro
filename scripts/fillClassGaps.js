// Script para equilibrar clases en todos los días y llenar los huecos vacíos
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fillClassGaps() {
  try {
    console.log('🔧 Llenando huecos de clases para todos los días...');

    // Primero verificar qué días ya tienen clases
    const existingClasses = await prisma.$queryRaw`
      SELECT 
        DATE(start) as fecha,
        COUNT(*) as total
      FROM TimeSlot 
      WHERE clubId = 'club-1'
      GROUP BY DATE(start)
      ORDER BY fecha
    `;

    console.log('📊 Estado actual de clases por día:');
    existingClasses.forEach(row => {
      console.log(`   ${row.fecha}: ${row.total} clases`);
    });

    // Definir horarios estándar para llenar días con pocas clases
    const standardTimeSlots = [
      { hour: 7, minute: 0, duration: 60 },   // 07:00-08:00
      { hour: 8, minute: 0, duration: 90 },   // 08:00-09:30
      { hour: 9, minute: 45, duration: 75 },  // 09:45-11:00
      { hour: 11, minute: 15, duration: 90 }, // 11:15-12:45
      { hour: 13, minute: 0, duration: 60 },  // 13:00-14:00
      { hour: 14, minute: 15, duration: 75 }, // 14:15-15:30
      { hour: 15, minute: 45, duration: 90 }, // 15:45-17:15
      { hour: 17, minute: 30, duration: 75 }, // 17:30-18:45
      { hour: 19, minute: 0, duration: 60 },  // 19:00-20:00
      { hour: 20, minute: 15, duration: 75 }, // 20:15-21:30
      { hour: 21, minute: 45, duration: 60 }  // 21:45-22:45
    ];

    const instructors = ['inst-1', 'inst-2', 'inst-3', 'inst-4'];
    const courts = ['court-1', 'court-2'];
    const levels = ['principiante', 'intermedio', 'avanzado'];
    const categories = ['abierta', 'masculina', 'femenina'];

    // Llenar días con pocas clases para que todos tengan al menos 12-15 clases
    const daysToFill = [
      '2025-09-07', // Día actual (pocas clases)
      '2025-09-09',
      '2025-09-11',
      '2025-09-12',
      '2025-09-13',
      '2025-09-14',
      '2025-09-15',
      '2025-09-16'
    ];

    let totalAdded = 0;

    for (const date of daysToFill) {
      // Verificar cuántas clases ya tiene este día
      const existing = await prisma.timeSlot.count({
        where: {
          clubId: 'club-1',
          start: {
            gte: new Date(`${date}T00:00:00Z`),
            lt: new Date(`${date}T23:59:59Z`)
          }
        }
      });

      console.log(`\n📅 Procesando ${date} (${existing} clases existentes)`);

      // Si tiene menos de 12 clases, agregar más
      const targetClasses = 14;
      const classesToAdd = Math.max(0, targetClasses - existing);

      if (classesToAdd > 0) {
        console.log(`   ➕ Agregando ${classesToAdd} clases nuevas`);

        for (let i = 0; i < classesToAdd; i++) {
          const timeSlot = standardTimeSlots[i % standardTimeSlots.length];
          const instructor = instructors[i % instructors.length];
          const court = courts[i % courts.length];
          const level = levels[i % levels.length];
          const category = categories[i % categories.length];

          // Calcular offset para evitar duplicados en el mismo día
          const hourOffset = Math.floor(i / standardTimeSlots.length);
          const adjustedHour = timeSlot.hour + hourOffset;

          // Si la hora ajustada es muy tarde, usar horarios tempranos del día siguiente conceptualmente
          const finalHour = adjustedHour > 23 ? (adjustedHour - 24) : adjustedHour;
          
          const startTime = new Date(`${date}T${finalHour.toString().padStart(2, '0')}:${timeSlot.minute.toString().padStart(2, '0')}:00Z`);
          const endTime = new Date(startTime.getTime() + (timeSlot.duration * 60 * 1000));

          const newClass = {
            id: `fill-${date}-${i + 1}-${Date.now()}`,
            clubId: 'club-1',
            courtId: court,
            instructorId: instructor,
            start: startTime,
            end: endTime,
            maxPlayers: 4,
            totalPrice: 30 + (i % 3) * 5, // Precios entre 30-40
            level: level,
            category: category
          };

          try {
            await prisma.timeSlot.create({ data: newClass });
            console.log(`     ✓ ${newClass.id} - ${finalHour}:${timeSlot.minute.toString().padStart(2, '0')} (${instructor}, ${level})`);
            totalAdded++;
          } catch (error) {
            if (error.code !== 'P2002') { // Ignorar duplicados
              console.log(`     ✗ Error: ${error.message}`);
            }
          }
        }
      } else {
        console.log(`   ✅ Ya tiene suficientes clases (${existing})`);
      }
    }

    console.log(`\n🎉 Proceso completado: ${totalAdded} clases agregadas`);

    // Mostrar resumen final
    console.log('\n📊 Estado final de clases por día:');
    const finalClasses = await prisma.$queryRaw`
      SELECT 
        DATE(start) as fecha,
        COUNT(*) as total
      FROM TimeSlot 
      WHERE clubId = 'club-1'
      GROUP BY DATE(start)
      ORDER BY fecha
    `;

    finalClasses.forEach(row => {
      const status = row.total >= 12 ? '✅' : '⚠️';
      console.log(`   ${status} ${row.fecha}: ${row.total} clases`);
    });

  } catch (error) {
    console.error('❌ Error llenando huecos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fillClassGaps();
