// Script para probar el query de bookings
const { PrismaClient } = require('@prisma/client');

async function testBookingsQuery() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Probando query de bookings...');
    
    // Query simple primero
    const simpleQuery = await prisma.$queryRaw`
      SELECT * FROM Booking LIMIT 2
    `;
    
    console.log('📋 Query simple funciona:', simpleQuery.length);
    
    // Query con JOIN como en el API
    const complexQuery = await prisma.$queryRaw`
      SELECT 
        b.id,
        b.userId,
        b.timeSlotId,
        b.groupSize,
        b.status,
        b.createdAt,
        b.updatedAt,
        u.name as userName,
        u.level as userLevel
      FROM Booking b
      LEFT JOIN User u ON b.userId = u.id
      WHERE b.timeSlotId = 'cmfxhfr1t0006tg5g27smnm1d'
      AND b.status IN ('PENDING', 'CONFIRMED')
      ORDER BY 
        CASE b.status 
          WHEN 'CONFIRMED' THEN 1 
          WHEN 'PENDING' THEN 2 
          ELSE 3 
        END,
        b.createdAt ASC
    `;
    
    console.log('📋 Query con JOIN funciona:', complexQuery.length);
    if (complexQuery.length > 0) {
      console.log('📋 Primer resultado:', JSON.stringify(complexQuery[0], (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2));
    }
    
  } catch (error) {
    console.error('❌ Error en query:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testBookingsQuery();