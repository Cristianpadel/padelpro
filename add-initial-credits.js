const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addInitialCredits() {
  try {
    console.log('💰 Agregando créditos iniciales a todos los usuarios...\n');
    
    // Agregar €100 a todos los usuarios que tengan 0 créditos
    const result = await prisma.user.updateMany({
      where: {
        credits: 0
      },
      data: {
        credits: 100.00
      }
    });
    
    console.log(`✅ Actualizado ${result.count} usuarios con €100.00 iniciales\n`);
    
    // Mostrar usuarios con sus nuevos saldos
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        credits: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('📋 Lista de usuarios y saldos:\n');
    users.forEach(user => {
      console.log(`  ${user.role === 'PLAYER' ? '👤' : '👨‍🏫'} ${user.name.padEnd(20)} | €${user.credits.toFixed(2).padStart(8)} | ${user.email}`);
    });
    
    console.log('\n✅ Proceso completado!');
    console.log('\n💡 Ahora los usuarios pueden hacer reservas y el sistema:');
    console.log('   - Descontará el precio al hacer una reserva');
    console.log('   - Reembolsará el precio al cancelar una reserva');
    console.log('   - Mostrará el historial en la pestaña "Mi Saldo"');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

addInitialCredits();
