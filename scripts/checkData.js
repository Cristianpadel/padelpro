// Simple script to check database directly
const { PrismaClient } = require('@prisma/client');

async function checkData() {
  const prisma = new PrismaClient();
  
  try {
    // Contar todas las clases
    const totalCount = await prisma.timeSlot.count();
    console.log(`Total TimeSlots in database: ${totalCount}`);
    
    // Contar por club
    const clubCount = await prisma.timeSlot.count({
      where: { clubId: 'club-1' }
    });
    console.log(`TimeSlots for club-1: ${clubCount}`);
    
    // Obtener una muestra de los primeros 3
    const sampleSlots = await prisma.timeSlot.findMany({
      take: 3,
      select: {
        id: true,
        clubId: true,
        start: true,
        end: true,
        instructorId: true
      }
    });
    
    console.log('Sample slots:');
    sampleSlots.forEach(slot => {
      console.log(`  ${slot.id} - ${slot.start} - ${slot.clubId} - ${slot.instructorId}`);
    });
    
    // Verificar si hay instructores
    const instructorCount = await prisma.instructor.count();
    console.log(`Total instructors: ${instructorCount}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
