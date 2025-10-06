const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyUserBalance() {
  try {
    console.log('🔍 Verificando saldo de usuarios...\n');
    
    // Obtener usuario Alex García con sus bookings
    const user = await prisma.user.findFirst({
      where: {
        name: 'Alex García'
      },
      include: {
        bookings: {
          include: {
            timeSlot: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log(`👤 Usuario: ${user.name}`);
    console.log(`💰 Saldo actual: €${user.credits.toFixed(2)}\n`);
    
    console.log(`📋 Historial de reservas (${user.bookings.length}):\n`);
    
    let totalGastado = 0;
    let totalReembolsado = 0;
    
    user.bookings.forEach((booking, index) => {
      const pricePerPerson = (booking.timeSlot?.totalPrice || 55) / (booking.groupSize || 1);
      const isCancelled = booking.status === 'CANCELLED';
      
      if (isCancelled) {
        totalReembolsado += pricePerPerson;
      } else {
        totalGastado += pricePerPerson;
      }
      
      console.log(`${index + 1}. ${isCancelled ? '↩️  Reembolso' : '💳 Reserva'}`);
      console.log(`   Estado: ${booking.status}`);
      console.log(`   Fecha: ${new Date(booking.createdAt).toLocaleDateString('es-ES')}`);
      console.log(`   Monto: ${isCancelled ? '+' : '-'}€${pricePerPerson.toFixed(2)}`);
      console.log(`   Jugadores: ${booking.groupSize}`);
      console.log('');
    });
    
    console.log('📊 RESUMEN:');
    console.log(`   Total Gastado: -€${totalGastado.toFixed(2)}`);
    console.log(`   Total Reembolsado: +€${totalReembolsado.toFixed(2)}`);
    console.log(`   Balance: ${totalReembolsado - totalGastado >= 0 ? '+' : ''}€${(totalReembolsado - totalGastado).toFixed(2)}`);
    
    console.log('\n✅ Verificación completada!');
    console.log('\n💡 La pestaña "Mi Saldo" mostrará:');
    console.log('   - Saldo actual del usuario (credits)');
    console.log('   - Historial completo de movimientos');
    console.log('   - Desglose por reservas y cancelaciones');
    console.log('   - Totales y balance general');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyUserBalance();
