// Arreglar el constraint UNIQUE para permitir múltiples groupSize
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixUniqueConstraint() {
  try {
    console.log('🔧 Arreglando constraint UNIQUE de Booking...');
    
    // 1. Eliminar el índice único actual (solo userId, timeSlotId)
    console.log('🗑️ Eliminando índice único actual...');
    await prisma.$executeRaw`DROP INDEX IF EXISTS "Booking_userId_timeSlotId_key"`;
    console.log('✅ Índice antiguo eliminado');
    
    // 2. Crear nuevo índice único que incluya groupSize (userId, timeSlotId, groupSize)
    console.log('🔄 Creando nuevo índice único con groupSize...');
    await prisma.$executeRaw`
      CREATE UNIQUE INDEX "Booking_userId_timeSlotId_groupSize_key" 
      ON "Booking" ("userId", "timeSlotId", "groupSize")
    `;
    console.log('✅ Nuevo índice único creado');
    
    // 3. Verificar que el cambio funcionó
    console.log('🔍 Verificando nuevos índices...');
    const indexes = await prisma.$queryRaw`PRAGMA index_list(Booking)`;
    console.log('📋 Índices actualizados:', indexes);
    
    console.log('🎉 ¡Constraint arreglado! Ahora puedes tener múltiples reservas por modalidad');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUniqueConstraint();