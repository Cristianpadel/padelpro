const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupInstructors() {
  try {
    console.log('🧹 Limpiando instructores con nombres genéricos...\n');
    
    // Encontrar instructores con nombres genéricos
    const allInstructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      }
    });
    
    console.log(`📊 Total instructores: ${allInstructors.length}\n`);
    
    const toDelete = allInstructors.filter(inst => 
      inst.user.name.includes('María Instructora') || 
      inst.user.name.includes('undefined') ||
      inst.user.email.includes('fresh-instructor')
    );
    
    console.log(`🗑️ Instructores a eliminar: ${toDelete.length}`);
    toDelete.forEach(inst => {
      console.log(`  - ${inst.user.name} (${inst.id})`);
    });
    
    // Eliminar TimeSlots asociados a esos instructores
    for (const inst of toDelete) {
      const deletedSlots = await prisma.timeSlot.deleteMany({
        where: { instructorId: inst.id }
      });
      console.log(`  🗑️ Eliminados ${deletedSlots.count} slots de ${inst.user.name}`);
      
      // Eliminar el instructor
      await prisma.instructor.delete({
        where: { id: inst.id }
      });
      
      // Eliminar el usuario
      await prisma.user.delete({
        where: { id: inst.userId }
      });
      
      console.log(`  ✅ Eliminado: ${inst.user.name}`);
    }
    
    console.log('\n📋 Instructores finales:');
    const finalInstructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      }
    });
    
    finalInstructors.forEach((inst, i) => {
      console.log(`${i + 1}. ${inst.user.name} - ${inst.specialties}`);
    });
    
    console.log(`\n✨ Total: ${finalInstructors.length} instructores activos`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupInstructors();
