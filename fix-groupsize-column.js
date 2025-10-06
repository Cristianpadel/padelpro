// Script para agregar la columna groupSize a la tabla Booking
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addGroupSizeColumn() {
  try {
    console.log('🔧 Agregando columna groupSize a la tabla Booking...');
    
    // Verificar si la columna ya existe
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('📋 Estructura actual de Booking:', tableInfo);
    
    const hasGroupSize = tableInfo.some(col => col.name === 'groupSize');
    
    if (hasGroupSize) {
      console.log('✅ La columna groupSize ya existe');
    } else {
      console.log('🔄 Agregando columna groupSize...');
      await prisma.$executeRaw`ALTER TABLE Booking ADD COLUMN groupSize INTEGER DEFAULT 1`;
      console.log('✅ Columna groupSize agregada exitosamente');
    }
    
    // Actualizar reservas existentes para que tengan groupSize = 1 por defecto
    console.log('🔄 Actualizando reservas existentes...');
    await prisma.$executeRaw`UPDATE Booking SET groupSize = 1 WHERE groupSize IS NULL`;
    console.log('✅ Reservas existentes actualizadas');
    
    // Verificar que todo esté correcto
    const updatedBookings = await prisma.booking.findMany();
    console.log('📋 Reservas actualizadas:', updatedBookings);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addGroupSizeColumn();