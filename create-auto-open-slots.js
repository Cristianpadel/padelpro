const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createAutoOpenSlots() {
  try {
    console.log('🎯 === CREANDO SISTEMA DE TARJETAS ABIERTAS AUTOMÁTICAS ===');
    
    // Get existing data
    const club = await prisma.club.findFirst();
    const courts = await prisma.court.findMany();
    const instructors = await prisma.instructor.findMany();
    
    console.log('🏢 Club:', club?.name);
    console.log('🏟️ Canchas:', courts.length);
    console.log('👨‍🏫 Instructores:', instructors.length);
    
    if (!club) {
      console.log('❌ No club found');
      return;
    }

    if (instructors.length === 0) {
      console.log('❌ No instructors found');
      return;
    }
    
    // Crear tarjetas para hoy y mañana
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const dates = [today, tomorrow];
    let totalSlotsCreated = 0;
    
    for (const date of dates) {
      date.setHours(0, 0, 0, 0);
      console.log(`\n📅 Creando tarjetas para: ${date.toDateString()}`);
      
      let dailySlotsCreated = 0;
      
      // Crear slots cada 30 minutos de 8:00 AM a 10:00 PM (14 horas = 28 slots)
      for (let hour = 8; hour < 22; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
          const startTime = new Date(date);
          startTime.setHours(hour, minute, 0, 0);
          
          const endTime = new Date(startTime);
          endTime.setMinutes(endTime.getMinutes() + 90); // Clases de 90 minutos
          
          // Crear UNA tarjeta ABIERTA por instructor para cada horario
          for (const instructor of instructors) {
            // Usar cancha rotativamente
            const court = courts[dailySlotsCreated % courts.length] || null;
            
            const slotId = `open-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}${date.getDate().toString().padStart(2,'0')}-${hour.toString().padStart(2,'0')}${minute.toString().padStart(2,'0')}-${instructor.id}`;
            
            try {
              await prisma.timeSlot.create({
                data: {
                  id: slotId,
                  clubId: club.id,
                  courtId: court?.id || null,
                  instructorId: instructor.id,
                  start: startTime,
                  end: endTime,
                  maxPlayers: 4,
                  totalPrice: 25 + Math.random() * 20, // Precio entre 25-45€
                  level: 'abierto',      // 🎯 NIVEL ABIERTO INICIAL
                  category: 'mixto'      // 🎯 CATEGORÍA ABIERTA INICIAL
                }
              });
              
              dailySlotsCreated++;
              totalSlotsCreated++;
              
              if (dailySlotsCreated % 10 === 0) {
                console.log(`   ✓ ${dailySlotsCreated} tarjetas creadas...`);
              }
              
            } catch (error) {
              if (error.code === 'P2002') {
                console.log(`   ⚠️ Slot ya existe: ${slotId}`);
              } else {
                console.log(`   ❌ Error creando ${slotId}:`, error.message);
              }
            }
          }
        }
      }
      
      console.log(`✅ ${dailySlotsCreated} tarjetas creadas para ${date.toDateString()}`);
    }
    
    console.log(`\n🎉 TOTAL: ${totalSlotsCreated} tarjetas abiertas creadas`);
    
    // Verificar resultado
    const totalSlots = await prisma.timeSlot.count({
      where: {
        clubId: club.id,
        level: 'abierto',
        category: 'mixto'
      }
    });
    
    console.log(`📊 Verificación: ${totalSlots} tarjetas abiertas en la base de datos`);
    
    // Mostrar ejemplo de tarjetas creadas
    const sampleSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: club.id,
        level: 'abierto'
      },
      include: {
        instructor: true,
        court: true
      },
      take: 3,
      orderBy: {
        start: 'asc'
      }
    });
    
    console.log('\n📋 Ejemplos de tarjetas creadas:');
    sampleSlots.forEach((slot, index) => {
      console.log(`   ${index + 1}. ${slot.id}`);
      console.log(`      📅 ${slot.start.toLocaleString()}`);
      console.log(`      👨‍🏫 Instructor: ${slot.instructor?.name || 'N/A'}`);
      console.log(`      🏟️ Cancha: ${slot.court?.number || 'N/A'}`);
      console.log(`      🎯 Nivel: ${slot.level} | Categoría: ${slot.category}`);
      console.log(`      💰 Precio: €${slot.totalPrice}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

createAutoOpenSlots().finally(() => prisma.$disconnect());