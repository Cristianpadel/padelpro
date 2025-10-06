const { PrismaClient } = require('@prisma/client');

async function checkAndAddGroupSize() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Verificando estructura de la tabla Booking...');
    
    // Verificar estructura actual
    const tableInfo = await prisma.$queryRaw`PRAGMA table_info(Booking);`;
    console.log('📋 Columnas actuales:', tableInfo.map(c => c.name));
    
    const hasGroupSize = tableInfo.some(col => col.name === 'groupSize');
    
    if (!hasGroupSize) {
      console.log('🔄 Agregando columna groupSize...');
      await prisma.$executeRaw`ALTER TABLE Booking ADD COLUMN groupSize INTEGER DEFAULT 1`;
      console.log('✅ Columna groupSize agregada correctamente');
    } else {
      console.log('ℹ️ La columna groupSize ya existe');
    }
    
    // Mostrar estructura final
    const finalTableInfo = await prisma.$queryRaw`PRAGMA table_info(Booking);`;
    console.log('📋 Estructura final:', JSON.stringify(finalTableInfo, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAndAddGroupSize();