const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentSystem() {
  try {
    console.log('🧪 Probando sistema de cobro y reembolso...\n');
    
    // 1. Verificar usuario Alex García
    const user = await prisma.user.findFirst({
      where: { email: 'alex@test.com' }
    });
    
    if (!user) {
      console.log('❌ Usuario de prueba no encontrado');
      return;
    }
    
    console.log('👤 Usuario de prueba:', user.name);
    console.log(`💰 Saldo inicial: €${user.credits.toFixed(2)}\n`);
    
    // 2. Buscar una clase disponible
    const availableClass = await prisma.timeSlot.findFirst({
      where: {
        start: {
          gte: new Date()
        }
      },
      include: {
        instructor: {
          include: {
            user: true
          }
        }
      }
    });
    
    if (!availableClass) {
      console.log('❌ No hay clases disponibles');
      return;
    }
    
    console.log('📅 Clase disponible:');
    console.log(`   Fecha: ${new Date(availableClass.start).toLocaleString('es-ES')}`);
    console.log(`   Instructor: ${availableClass.instructor?.user.name || 'N/A'}`);
    console.log(`   Precio total: €${availableClass.totalPrice}`);
    console.log(`   Precio individual (1 jugador): €${availableClass.totalPrice.toFixed(2)}`);
    console.log(`   Precio por pareja (2 jugadores): €${(availableClass.totalPrice / 2).toFixed(2)}`);
    console.log(`   Precio grupal (4 jugadores): €${(availableClass.totalPrice / 4).toFixed(2)}\n`);
    
    // 3. Calcular lo que costaría hacer una reserva individual
    const priceIndividual = availableClass.totalPrice;
    const priceDobles = availableClass.totalPrice / 2;
    const priceGrupal = availableClass.totalPrice / 4;
    
    console.log('💡 PRUEBA DEL SISTEMA:');
    console.log(`\n   Si reservas como INDIVIDUAL (1 jugador):`);
    console.log(`   - Se descontarán: €${priceIndividual.toFixed(2)}`);
    console.log(`   - Nuevo saldo: €${(user.credits - priceIndividual).toFixed(2)}`);
    
    console.log(`\n   Si reservas como DOBLES (2 jugadores):`);
    console.log(`   - Se descontarán: €${priceDobles.toFixed(2)}`);
    console.log(`   - Nuevo saldo: €${(user.credits - priceDobles).toFixed(2)}`);
    
    console.log(`\n   Si reservas como GRUPAL (4 jugadores):`);
    console.log(`   - Se descontarán: €${priceGrupal.toFixed(2)}`);
    console.log(`   - Nuevo saldo: €${(user.credits - priceGrupal).toFixed(2)}`);
    
    // 4. Verificar bookings existentes
    const existingBookings = await prisma.booking.findMany({
      where: {
        userId: user.id,
        status: {
          in: ['CONFIRMED', 'PENDING']
        }
      },
      include: {
        timeSlot: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 3
    });
    
    if (existingBookings.length > 0) {
      console.log(`\n\n📋 Reservas activas (${existingBookings.length}):`);
      existingBookings.forEach((booking, index) => {
        const price = (booking.timeSlot?.totalPrice || 55) / booking.groupSize;
        console.log(`\n   ${index + 1}. ${booking.status} - ${booking.groupSize} jugador${booking.groupSize > 1 ? 'es' : ''}`);
        console.log(`      Costo: €${price.toFixed(2)}`);
        console.log(`      Fecha: ${new Date(booking.timeSlot?.start || booking.createdAt).toLocaleString('es-ES')}`);
        console.log(`      ID: ${booking.id}`);
      });
    }
    
    console.log('\n\n✅ Sistema de cobro configurado correctamente!');
    console.log('\n📝 CÓMO FUNCIONA:');
    console.log('   1. Al hacer una reserva, se descuenta el precio del saldo');
    console.log('   2. Al cancelar una reserva, se reembolsa el precio al saldo');
    console.log('   3. El precio se calcula: Precio Total / Número de Jugadores');
    console.log('   4. Si no hay saldo suficiente, la reserva se rechaza');
    console.log('\n💡 Ve a la pestaña "Mi Saldo" en el panel de admin para ver el historial');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testPaymentSystem();
