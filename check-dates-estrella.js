const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDates() {
  try {
    const classes = await prisma.timeSlot.findMany({
      where: { 
        clubId: 'cmftnbe2o0001tgkobtrxipip',
        category: 'class'
      },
      select: {
        id: true,
        start: true,
        end: true,
        level: true
      },
      orderBy: { start: 'asc' },
      take: 10
    });
    
    console.log('📅 Primeras 10 clases:');
    classes.forEach((c, i) => {
      const startDate = new Date(c.start);
      const localDate = startDate.toISOString().split('T')[0];
      const localTime = startDate.toISOString().split('T')[1].substring(0,5);
      console.log(`  ${i+1}. ${localDate} ${localTime} UTC | ${c.level} | ID: ${c.id.substring(0,10)}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDates();