const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function resetBookings() {
  try {
    console.log('🔄 Iniciando reset de la base de datos de reservas...');
    
    // Contar reservas existentes antes del reset
    const existingBookings = await prisma.booking.count();
    console.log(`📊 Reservas existentes antes del reset: ${existingBookings}`);
    
    if (existingBookings === 0) {
      console.log('✅ No hay reservas para eliminar.');
      return;
    }
    
    // Eliminar todas las reservas
    const deleteResult = await prisma.booking.deleteMany({});
    console.log(`🗑️ Reservas eliminadas: ${deleteResult.count}`);
    
    // Verificar que se eliminaron todas las reservas
    const remainingBookings = await prisma.booking.count();
    console.log(`📊 Reservas restantes después del reset: ${remainingBookings}`);
    
    if (remainingBookings === 0) {
      console.log('✅ Reset completado exitosamente. Todas las reservas han sido eliminadas.');
    } else {
      console.log('⚠️ Advertencia: Algunas reservas no se pudieron eliminar.');
    }
    
    // Mostrar información de las clases que ahora están disponibles
    const availableTimeSlots = await prisma.timeSlot.count();
    console.log(`📅 Clases disponibles para nuevas reservas: ${availableTimeSlots}`);
    
  } catch (error) {
    console.error('❌ Error durante el reset de reservas:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el reset
resetBookings();