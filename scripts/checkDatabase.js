// Simple script to check database structure
const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    // Verificar qué datos realmente tenemos
    console.log('=== Verificando estructura de TimeSlot ===');
    
    // Usar queryRaw para ver la estructura real
    const result = await prisma.$queryRaw`PRAGMA table_info(TimeSlot)`;
    console.log('Estructura de tabla TimeSlot:');
    console.log(result);
    
    console.log('\n=== Verificando datos existentes ===');
    const slots = await prisma.$queryRaw`SELECT * FROM TimeSlot LIMIT 3`;
    console.log('Datos de ejemplo:');
    console.log(slots);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();
