const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRawDates() {
  try {
    // Get raw dates from DB
    const result = await prisma.$queryRaw`
      SELECT id, start, clubId
      FROM TimeSlot
      WHERE start LIKE '2025-10-03%'
      ORDER BY start ASC
      LIMIT 5
    `;
    
    console.log('Raw dates from database for Oct 3rd:\n');
    result.forEach((row, i) => {
      console.log(`Row ${i + 1}:`);
      console.log(`  ID: ${row.id}`);
      console.log(`  Start (raw): ${row.start}`);
      console.log(`  Club: ${row.clubId}`);
      console.log('');
    });
    
    console.log(`Total results: ${result.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRawDates();
