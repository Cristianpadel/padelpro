const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDatesWithData() {
  try {
    const slots = await prisma.timeSlot.findMany({
      orderBy: { start: 'asc' }
    });
    
    console.log('Total slots in database:', slots.length);
    
    if (slots.length > 0) {
      const dates = [...new Set(slots.map(slot => {
        const date = new Date(slot.start);
        return date.toISOString().split('T')[0];
      }))];
      
      console.log('Dates with data:');
      dates.forEach(date => {
        const slotsForDate = slots.filter(slot => {
          const slotDate = new Date(slot.start).toISOString().split('T')[0];
          return slotDate === date;
        });
        console.log(`  ${date}: ${slotsForDate.length} slots`);
      });
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDatesWithData().finally(() => prisma.$disconnect());
