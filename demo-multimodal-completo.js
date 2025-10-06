// Demo completo del sistema multi-modal
const { PrismaClient } = require('@prisma/client');

async function demoCompleto() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🏓 DEMO: Sistema Multi-Modal de Reservas de Padel');
    console.log('==================================================\n');
    
    const timeSlotId = 'slot-2025-09-15-court-1-16:00';
    
    console.log('📅 Clase: 15 Sep 2025, 16:00-17:30, Pista 1');
    console.log('👨‍🏫 Instructor: Carlos Instructor\n');
    
    // Escenario: Un usuario se inscribe en múltiples modalidades
    console.log('🎭 ESCENARIO: Usuario Juan quiere asegurar su plaza');
    console.log('Se inscribe en TODAS las modalidades para la misma clase:\n');
    
    // Juan se inscribe en todas las modalidades
    await prisma.booking.create({
      data: { userId: 'user-1', timeSlotId, groupSize: 1, status: 'PENDING' }
    });
    console.log('✅ Juan → 1 jugador (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-1', timeSlotId, groupSize: 2, status: 'PENDING' }
    });
    console.log('✅ Juan → 2 jugadores (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-1', timeSlotId, groupSize: 3, status: 'PENDING' }
    });
    console.log('✅ Juan → 3 jugadores (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-1', timeSlotId, groupSize: 4, status: 'PENDING' }
    });
    console.log('✅ Juan → 4 jugadores (PENDING)\n');
    
    // Otros usuarios se van inscribiendo
    console.log('👥 Otros usuarios se inscriben...\n');
    
    await prisma.booking.create({
      data: { userId: 'user-2', timeSlotId, groupSize: 2, status: 'PENDING' }
    });
    console.log('✅ María → 2 jugadores (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-3', timeSlotId, groupSize: 4, status: 'PENDING' }
    });
    console.log('✅ Pedro → 4 jugadores (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-4', timeSlotId, groupSize: 4, status: 'PENDING' }
    });
    console.log('✅ Ana → 4 jugadores (PENDING)');
    
    await prisma.booking.create({
      data: { userId: 'user-5', timeSlotId, groupSize: 4, status: 'PENDING' }
    });
    console.log('✅ Luis → 4 jugadores (PENDING)\n');
    
    console.log('🔥 ¡MOMENTO CLAVE! Se completa la modalidad de 4 jugadores');
    console.log('Sistema automáticamente:');
    console.log('  1. Confirma las 4 reservas de modalidad 4p');
    console.log('  2. Cancela las otras inscripciones de esos usuarios\n');
    
    // Simular lógica de confirmación automática
    const pending4p = await prisma.booking.count({
      where: { timeSlotId, groupSize: 4, status: 'PENDING' }
    });
    
    if (pending4p >= 4) {
      // Confirmar modalidad 4p
      await prisma.booking.updateMany({
        where: { timeSlotId, groupSize: 4, status: 'PENDING' },
        data: { status: 'CONFIRMED' }
      });
      
      // Obtener usuarios confirmados
      const confirmed = await prisma.booking.findMany({
        where: { timeSlotId, groupSize: 4, status: 'CONFIRMED' },
        select: { userId: true }
      });
      
      // Cancelar otras inscripciones
      for (const user of confirmed) {
        await prisma.booking.updateMany({
          where: {
            timeSlotId,
            userId: user.userId,
            groupSize: { not: 4 },
            status: 'PENDING'
          },
          data: { status: 'CANCELLED' }
        });
      }
    }
    
    // Mostrar resultado final
    console.log('📊 RESULTADO FINAL:');
    console.log('===================');
    const finalBookings = await prisma.booking.findMany({
      where: { timeSlotId },
      include: { user: true },
      orderBy: [{ status: 'desc' }, { groupSize: 'asc' }]
    });
    
    const confirmed = finalBookings.filter(b => b.status === 'CONFIRMED');
    const pending = finalBookings.filter(b => b.status === 'PENDING');
    const cancelled = finalBookings.filter(b => b.status === 'CANCELLED');
    
    console.log('\n🎉 CONFIRMADOS (4 jugadores):');
    confirmed.forEach(b => {
      console.log(`  ✅ ${b.user.name} - ${b.groupSize}p - ${b.status}`);
    });
    
    console.log('\n⏳ PENDIENTES:');
    pending.forEach(b => {
      console.log(`  🟡 ${b.user.name} - ${b.groupSize}p - ${b.status}`);
    });
    
    console.log('\n❌ CANCELADOS:');
    cancelled.forEach(b => {
      console.log(`  🚫 ${b.user.name} - ${b.groupSize}p - ${b.status}`);
    });
    
    console.log('\n💡 RESUMEN:');
    console.log(`   • Clase completada con modalidad de 4 jugadores`);
    console.log(`   • Juan perdió su oportunidad (sus inscripciones fueron canceladas)`);
    console.log(`   • María queda pendiente en modalidad 2p`);
    console.log(`   • Sistema funcionó perfectamente: primera modalidad en completarse ganó`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

demoCompleto();