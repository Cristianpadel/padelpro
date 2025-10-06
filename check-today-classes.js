const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTodayClasses() {
  try {
    const slots = await prisma.$queryRaw`
      SELECT id, start, end, level, totalPrice 
      FROM TimeSlot 
      WHERE DATE(start) = '2025-09-24' 
      ORDER BY start
    `;
    console.log('Clases de hoy (2025-09-24):', slots);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTodayClasses();