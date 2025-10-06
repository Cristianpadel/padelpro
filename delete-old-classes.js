const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteOldClasses() {
  try {
    console.log('🗑️ Eliminando clases antiguas de Padel Estrella...\n');
    
    const result = await prisma.timeSlot.deleteMany({
      where: {
        clubId: 'club-padel-estrella'
      }
    });
    
    console.log(`✅ Eliminadas ${result.count} clases\n`);
    console.log('✨ Ahora puedes generar nuevas clases con instructores reales desde el panel de admin!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteOldClasses();
