const { PrismaClient } = require('@prisma/client');

async function checkFullDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== ANÁLISIS COMPLETO DE LA BASE DE DATOS ===\n');
    
    // 1. Verificar qué tablas existen
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'
    `;
    
    console.log('📋 TABLAS ENCONTRADAS:');
    tables.forEach(table => console.log(`  - ${table.name}`));
    console.log(`\nTotal de tablas: ${tables.length}\n`);
    
    // 2. Verificar estructura de cada tabla
    for (const table of tables) {
      console.log(`📊 ESTRUCTURA DE TABLA: ${table.name.toUpperCase()}`);
      console.log('━'.repeat(50));
      
      try {
        const schema = await prisma.$queryRaw`PRAGMA table_info(${table.name})`;
        schema.forEach(col => {
          console.log(`  ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
        });
      } catch (e) {
        console.log(`  ❌ Error leyendo esquema: ${e.message}`);
      }
      console.log('');
    }
    
    // 3. Verificar datos existentes en cada tabla
    console.log('📊 DATOS EXISTENTES:\n');
    
    for (const table of tables) {
      try {
        const count = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM ${table.name}`);
        console.log(`${table.name}: ${count[0].count} registros`);
        
        // Mostrar algunos ejemplos si hay datos
        if (count[0].count > 0) {
          const samples = await prisma.$queryRawUnsafe(`SELECT * FROM ${table.name} LIMIT 3`);
          console.log(`  Ejemplos:`);
          samples.forEach((sample, i) => {
            console.log(`    ${i+1}. ${JSON.stringify(sample, null, 2).replace(/\n/g, '\n      ')}`);
          });
        }
        console.log('');
      } catch (e) {
        console.log(`  ❌ Error verificando datos de ${table.name}: ${e.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR GENERAL:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkFullDatabase();