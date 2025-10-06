const { PrismaClient } = require('@prisma/client');

async function checkInstructors() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== VERIFICANDO INSTRUCTORES ===');
    const instructors = await prisma.instructor.findMany({
      include: {
        user: true
      }
    });
    
    console.log(`Total instructores: ${instructors.length}`);
    instructors.forEach((instructor, index) => {
      console.log(`\n${index + 1}. Instructor ID: ${instructor.id}`);
      console.log(`   Usuario: ${instructor.user?.name || 'SIN NOMBRE'}`);
      console.log(`   Email: ${instructor.user?.email || 'SIN EMAIL'}`);
      console.log(`   Club ID: ${instructor.clubId}`);
      console.log(`   Activo: ${instructor.isActive}`);
      console.log(`   Experiencia: ${instructor.experience}`);
    });

    console.log('\n=== VERIFICANDO CANCHAS ===');
    const courts = await prisma.court.findMany();
    console.log(`Total canchas: ${courts.length}`);
    courts.forEach((court, index) => {
      console.log(`${index + 1}. Cancha: ${court.name} (Club: ${court.clubId}, Activa: ${court.isActive})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors();