const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRawDates() {
  try {
    console.log('Verificando el formato bruto de las fechas...');
    
    // Query directa a la tabla para ver el formato crudo
    const rawData = await prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        start, 
        typeof(start) as start_type,
        length(start) as start_length
      FROM TimeSlot 
      WHERE clubId = ? 
      LIMIT 5
    `, 'club-1');

    console.log('Datos crudos:');
    rawData.forEach(row => {
      console.log(`ID: ${row.id}`);
      console.log(`Start: ${row.start}`);
      console.log(`Type: ${row.start_type}`);
      console.log(`Length: ${row.start_length}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRawDates();
