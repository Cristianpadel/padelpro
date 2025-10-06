const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      }
    });
    
    console.log(`Instructores encontrados para Padel Estrella: ${instructors.length}\n`);
    
    instructors.forEach((instructor, i) => {
      console.log(`${i + 1}. ${instructor.name} (ID: ${instructor.id})`);
    });
    
    if (instructors.length === 0) {
      console.log('\n⚠️  No hay instructores. Vamos a crear algunos instructores de ejemplo...\n');
      
      const newInstructors = [
        { id: 'instructor-carlos-padel-estrella', name: 'Carlos Martínez', clubId: 'club-padel-estrella' },
        { id: 'instructor-lucia-padel-estrella', name: 'Lucía García', clubId: 'club-padel-estrella' },
        { id: 'instructor-miguel-padel-estrella', name: 'Miguel Rodríguez', clubId: 'club-padel-estrella' },
        { id: 'instructor-ana-padel-estrella', name: 'Ana López', clubId: 'club-padel-estrella' },
        { id: 'instructor-david-padel-estrella', name: 'David Fernández', clubId: 'club-padel-estrella' },
        { id: 'instructor-elena-padel-estrella', name: 'Elena Sánchez', clubId: 'club-padel-estrella' },
      ];
      
      for (const instructor of newInstructors) {
        await prisma.instructor.create({
          data: instructor
        });
        console.log(`✅ Creado: ${instructor.name}`);
      }
      
      console.log('\n✨ Instructores creados exitosamente!');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors();
