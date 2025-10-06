const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDateQuery() {
  try {
    console.log('🔍 Probando diferentes queries de fecha...');
    
    // Query 1: Buscar todas las clases sin filtro de fecha
    const allClasses = await prisma.timeSlot.findMany({
      where: { 
        clubId: 'cmftnbe2o0001tgkobtrxipip',
        category: 'class'
      },
      take: 3,
      orderBy: { start: 'asc' }
    });
    
    console.log('📚 Total clases sin filtro:', allClasses.length);
    if (allClasses.length > 0) {
      console.log('Primera clase:', {
        start: allClasses[0].start,
        startISO: allClasses[0].start.toISOString(),
        level: allClasses[0].level
      });
    }
    
    // Query 2: Usando SQL directo con diferentes formatos de fecha
    const date = '2025-09-21';
    
    console.log(`\n🔍 Probando con fecha: ${date}`);
    
    // Formato 1: Con rango de tiempo
    const query1 = `SELECT COUNT(*) as count FROM TimeSlot WHERE clubId = ? AND start >= ? AND start < ?`;
    const startOfDay = `${date} 00:00:00`;
    const nextDay = `2025-09-22 00:00:00`;
    
    const result1 = await prisma.$queryRawUnsafe(query1, 'cmftnbe2o0001tgkobtrxipip', startOfDay, nextDay);
    console.log(`Rango ${startOfDay} a ${nextDay}:`, result1[0]);
    
    // Formato 2: Con LIKE para buscar fechas que empiecen con la fecha
    const query2 = `SELECT COUNT(*) as count FROM TimeSlot WHERE clubId = ? AND start LIKE ?`;
    const likePattern = `${date}%`;
    
    const result2 = await prisma.$queryRawUnsafe(query2, 'cmftnbe2o0001tgkobtrxipip', likePattern);
    console.log(`LIKE '${likePattern}':`, result2[0]);
    
    // Query 3: Ver el formato exacto de las fechas almacenadas
    const query3 = `SELECT start, datetime(start) as formatted_start FROM TimeSlot WHERE clubId = ? LIMIT 3`;
    const result3 = await prisma.$queryRawUnsafe(query3, 'cmftnbe2o0001tgkobtrxipip');
    console.log('\n📅 Fechas almacenadas:');
    result3.forEach((r, i) => {
      console.log(`  ${i+1}. start: ${r.start}, formatted: ${r.formatted_start}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testDateQuery();