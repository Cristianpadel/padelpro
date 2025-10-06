const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixInstructors() {
  try {
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      }
    });
    
    console.log(`Actualizando ${instructors.length} instructores...\n`);
    
    const names = [
      'Carlos Martínez',
      'Lucía García', 
      'Miguel Rodríguez',
      'Ana López',
      'David Fernández',
      'Elena Sánchez'
    ];
    
    for (let i = 0; i < instructors.length; i++) {
      const instructor = instructors[i];
      const newName = names[i] || `Instructor ${i + 1}`;
      
      await prisma.instructor.update({
        where: { id: instructor.id },
        data: { name: newName }
      });
      
      console.log(`✅ Actualizado ${instructor.id} -> ${newName}`);
    }
    
    // Si hay menos de 6 instructores, crear los que faltan
    if (instructors.length < 6) {
      console.log(`\nCreando ${6 - instructors.length} instructores adicionales...\n`);
      
      for (let i = instructors.length; i < 6; i++) {
        const newInstructor = await prisma.instructor.create({
          data: {
            id: `instructor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: names[i],
            clubId: 'club-padel-estrella'
          }
        });
        
        console.log(`✅ Creado: ${newInstructor.name} (${newInstructor.id})`);
      }
    }
    
    console.log('\n✨ Instructores listos!');
    
    // Mostrar lista final
    const finalList = await prisma.instructor.findMany({
      where: { clubId: 'club-padel-estrella' }
    });
    
    console.log('\n📋 Lista final de instructores:');
    finalList.forEach((inst, i) => {
      console.log(`${i + 1}. ${inst.name} (${inst.id})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixInstructors();
