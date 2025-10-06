const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addProfilePictures() {
  try {
    console.log('🎨 Añadiendo fotos de perfil a todos los instructores...\n');
    
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      }
    });
    
    console.log(`📊 Instructores encontrados: ${instructors.length}\n`);
    
    for (const instructor of instructors) {
      if (!instructor.user.profilePictureUrl) {
        const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(instructor.user.name)}`;
        
        await prisma.user.update({
          where: { id: instructor.userId },
          data: { profilePictureUrl: avatarUrl }
        });
        
        console.log(`✅ ${instructor.user.name} - Foto añadida`);
      } else {
        console.log(`⚠️ ${instructor.user.name} - Ya tiene foto`);
      }
    }
    
    console.log('\n✨ Proceso completado!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addProfilePictures();
