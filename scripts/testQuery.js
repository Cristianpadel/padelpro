const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testQuery() {
  try {
    console.log('Probando query directa...');
    
    // Query con DATE()
    const withDateFunc = await prisma.$queryRawUnsafe(`
      SELECT 
        ts.id, 
        ts.start, 
        DATE(ts.start) as date_only,
        ts.clubId
      FROM TimeSlot ts
      WHERE ts.clubId = ? 
      AND DATE(ts.start) = ?
      LIMIT 5
    `, 'club-1', '2025-09-06');

    console.log('Resultados con DATE():');
    withDateFunc.forEach(slot => {
      console.log(`ID: ${slot.id}, Start: ${slot.start}, Date: ${slot.date_only}`);
    });

    // Query manual con strftime
    const withStrftime = await prisma.$queryRawUnsafe(`
      SELECT 
        ts.id, 
        ts.start, 
        strftime('%Y-%m-%d', ts.start) as date_only,
        ts.clubId
      FROM TimeSlot ts
      WHERE ts.clubId = ? 
      AND strftime('%Y-%m-%d', ts.start) = ?
      LIMIT 5
    `, 'club-1', '2025-09-06');

    console.log('\nResultados con strftime():');
    withStrftime.forEach(slot => {
      console.log(`ID: ${slot.id}, Start: ${slot.start}, Date: ${slot.date_only}`);
    });

    // Ver qué fechas tenemos exactamente
    const allDates = await prisma.$queryRawUnsafe(`
      SELECT DISTINCT
        strftime('%Y-%m-%d', ts.start) as date_only,
        COUNT(*) as count
      FROM TimeSlot ts
      WHERE ts.clubId = ? 
      GROUP BY strftime('%Y-%m-%d', ts.start)
      ORDER BY date_only
    `, 'club-1');

    console.log('\nFechas disponibles:');
    allDates.forEach(row => {
      console.log(`${row.date_only}: ${row.count} slots`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testQuery();
