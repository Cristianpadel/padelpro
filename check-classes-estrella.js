const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClasses() {
  try {
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' }
    });
    
    if (!club) {
      console.log('❌ Club no encontrado');
      return;
    }
    
    const classes = await prisma.timeSlot.findMany({
      where: { 
        clubId: club.id,
        category: 'class'
      },
      orderBy: { start: 'asc' }
    });
    
    console.log('🏢 Club:', club.name, 'ID:', club.id);
    console.log('📚 Total de clases encontradas:', classes.length);
    
    if (classes.length > 0) {
      console.log('📅 Primeras 10 clases:');
      classes.slice(0, 10).forEach((c, i) => {
        const date = new Date(c.start).toISOString().split('T')[0];
        const time = new Date(c.start).toTimeString().split(' ')[0].substring(0,5);
        console.log(`  ${i+1}. ${date} ${time} - ${c.level} - Pista ${c.courtId} - ID: ${c.id}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClasses();