const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSlots() {
  try {
    const slots = await prisma.timeSlot.findMany();
    console.log('Available slots:');
    slots.forEach(s => console.log(` - ${s.id} (${s.date} ${s.startTime})`));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSlots();