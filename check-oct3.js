const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOct3() {
  try {
    console.log('Checking slots for October 3, 2025...\n');
    
    const slots = await prisma.timeSlot.findMany({
      where: {
        start: {
          gte: new Date('2025-10-03T00:00:00'),
          lte: new Date('2025-10-03T23:59:59')
        }
      },
      take: 5,
      orderBy: { start: 'asc' }
    });
    
    console.log(`Found ${slots.length} slots for Oct 3rd (showing first 5):\n`);
    slots.forEach(slot => {
      console.log(`ID: ${slot.id}`);
      console.log(`  Start: ${slot.start.toISOString()}`);
      console.log(`  Start Local: ${slot.start.toLocaleString('es-ES')}`);
      console.log(`  Club: ${slot.clubId}`);
      console.log('');
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOct3();
