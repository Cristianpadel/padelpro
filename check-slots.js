const { PrismaClient } = require('@prisma/client');

async function checkSlots() {
  const prisma = new PrismaClient();
  
  try {
    const slots = await prisma.$queryRaw`
      SELECT id, instructorId, start, end, level, category 
      FROM TimeSlot 
      ORDER BY start 
      LIMIT 5
    `;
    
    console.log('🎯 Primeros 5 TimeSlots creados:');
    slots.forEach((slot, i) => {
      const start = new Date(slot.start);
      const end = new Date(slot.end);
      console.log(`${i+1}. ${start.toLocaleTimeString()} - ${end.toLocaleTimeString()} (${slot.category})`);
    });

    const totalSlots = await prisma.$queryRaw`SELECT COUNT(*) as count FROM TimeSlot`;
    console.log(`\n📊 Total TimeSlots: ${totalSlots[0].count}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();
