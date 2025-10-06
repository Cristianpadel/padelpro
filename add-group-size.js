const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addGroupSizeColumn() {
  try {
    console.log('🔄 Adding groupSize column to Booking table...');
    
    // Agregar la columna groupSize a la tabla Booking
    await prisma.$executeRaw`
      ALTER TABLE Booking ADD COLUMN groupSize INTEGER DEFAULT 1
    `;
    
    console.log('✅ Column groupSize added successfully');
    
    // Actualizar todas las reservas existentes para que tengan groupSize = 1
    await prisma.$executeRaw`
      UPDATE Booking SET groupSize = 1 WHERE groupSize IS NULL
    `;
    
    console.log('✅ Updated existing bookings with groupSize = 1');
    
    // Verificar la estructura de la tabla
    const tableInfo = await prisma.$queryRaw`
      PRAGMA table_info(Booking)
    `;
    
    console.log('📊 Booking table structure:', tableInfo);
    
  } catch (error) {
    console.error('❌ Error adding groupSize column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addGroupSizeColumn();