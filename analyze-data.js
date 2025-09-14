const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  console.log('=== ANALYZING CURRENT DATA ===');
  
  // Check instructors
  const instructors = await prisma.instructor.findMany();
  console.log('Instructors:', instructors.length);
  instructors.forEach(i => console.log('  -', i.name, i.id));
  
  // Check courts
  const courts = await prisma.court.findMany();
  console.log('Courts:', courts.length);
  courts.forEach(c => console.log('  -', c.name, c.id));
  
  // Check time slots for one day
  const slots = await prisma.timeSlot.findMany({
    where: { 
      clubId: 'club-1',
      start: {
        gte: new Date('2025-09-08T00:00:00Z'),
        lt: new Date('2025-09-09T00:00:00Z')
      }
    },
    include: { instructor: true, court: true },
    orderBy: { start: 'asc' }
  });
  
  console.log('\nTime slots for 2025-09-08:', slots.length);
  console.log('Sample slots:');
  slots.slice(0, 10).forEach((slot, i) => {
    const date = new Date(Number(slot.start));
    console.log(`  ${i+1}. ${date.toISOString()} - Court: ${slot.court?.name || 'None'} - Instructor: ${slot.instructor?.name || 'None'}`);
  });
  
  if (slots.length > 10) {
    console.log('  ... and', slots.length - 10, 'more slots');
  }
  
  // Calculate how many slots we should have
  console.log('\n=== CALCULATION ===');
  console.log('Hours per day: 24');
  console.log('Slots per hour (every 30 min): 2');
  console.log('Expected base slots per day: 48');
  console.log('Instructors:', instructors.length);
  console.log('Courts:', courts.length);
  console.log('Current slots:', slots.length);
  console.log('Missing slots:', 48 - slots.length);
}

checkData().finally(() => prisma.$disconnect());
