// Script para limpiar reservas huérfanas con IDs antiguos
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanOrphanBookings() {
  try {
    console.log('\n🧹 LIMPIEZA DE RESERVAS HUÉRFANAS\n');
    console.log('='.repeat(60));

    // IDs antiguos que ya no existen
    const oldIds = ['user-1', 'cmfwmut4v0001tgs0en3il18d'];

    console.log('\n🔍 Buscando reservas con IDs antiguos...');
    
    const orphanBookings = await prisma.booking.findMany({
      where: {
        userId: {
          in: oldIds
        }
      }
    });

    console.log(`\n📊 Encontradas ${orphanBookings.length} reservas huérfanas`);

    if (orphanBookings.length === 0) {
      console.log('✅ No hay reservas huérfanas para limpiar');
      return;
    }

    console.log('\n⚠️  Las siguientes reservas serán eliminadas:');
    orphanBookings.forEach((b, i) => {
      console.log(`   ${i + 1}. User ID: ${b.userId.substring(0, 10)}..., TimeSlot: ${b.timeSlotId.substring(0, 15)}..., Status: ${b.status}`);
    });

    // Confirmar eliminación
    console.log('\n🗑️  Eliminando reservas huérfanas...');
    
    const result = await prisma.booking.deleteMany({
      where: {
        userId: {
          in: oldIds
        }
      }
    });

    console.log(`\n✅ Eliminadas ${result.count} reservas huérfanas`);

    // Verificar que Alex García todavía tiene sus reservas válidas
    const alexBookings = await prisma.booking.count({
      where: {
        userId: 'cmge3nlkv0001tg30p0pw8hdm'
      }
    });

    console.log(`\n✅ Alex García mantiene ${alexBookings} reservas válidas`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ Limpieza completada exitosamente\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanOrphanBookings();
