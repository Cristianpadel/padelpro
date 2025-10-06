const { PrismaClient } = require('@prisma/client');

async function checkAllSchemas() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== VERIFICANDO TODAS LAS ESTRUCTURAS ===\n');
    
    const tables = ['Club', 'User', 'TimeSlot', 'Booking', 'Instructor', 'Court'];
    
    for (const tableName of tables) {
      console.log(`📊 CAMPOS DE ${tableName.toUpperCase()}:`);
      const schema = await prisma.$queryRawUnsafe(`PRAGMA table_info(${tableName})`);
      schema.forEach(col => {
        console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}${col.dflt_value ? ` DEFAULT ${col.dflt_value}` : ''}`);
      });
      console.log('');
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllSchemas();