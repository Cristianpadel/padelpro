const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSlots() {
  try {
    const count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log('📊 Total TimeSlots creados:', count[0].count);
    
    const today = await prisma.$queryRaw`
      SELECT DATE(start) as date, COUNT(*) as slots_count 
      FROM TimeSlot 
      GROUP BY DATE(start) 
      ORDER BY date 
      LIMIT 7
    `;
    console.log('📅 Slots por día:');
    today.forEach(day => {
      console.log(`  ${day.date}: ${day.slots_count} slots`);
    });
    
    const sample = await prisma.$queryRaw`
      SELECT id, instructorId, start, end, maxPlayers, totalPrice
      FROM TimeSlot 
      ORDER BY start 
      LIMIT 5
    `;
    console.log('🔍 Muestra de slots:');
    sample.forEach(slot => {
      console.log(`  ${slot.start} - ${slot.end} | Instructor: ${slot.instructorId} | ${slot.maxPlayers} jugadores | $${slot.totalPrice}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();