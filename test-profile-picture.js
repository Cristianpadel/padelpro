const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testProfilePicture() {
  try {
    console.log('🧪 Probando actualización de foto de perfil...\n');
    
    // Obtener el primer instructor de Padel Estrella
    const instructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      },
      take: 1
    });
    
    if (instructors.length === 0) {
      console.log('❌ No se encontraron instructores');
      return;
    }
    
    const instructor = instructors[0];
    console.log(`📋 Instructor seleccionado: ${instructor.user.name}`);
    console.log(`   User ID: ${instructor.userId}`);
    console.log(`   Instructor ID: ${instructor.id}`);
    console.log(`   Foto actual: ${instructor.user.profilePictureUrl || 'Sin foto'}\n`);
    
    // URL de foto de ejemplo (usando un avatar placeholder)
    const testPhotoUrl = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + instructor.user.name;
    
    console.log('🖼️ Actualizando con foto de prueba:', testPhotoUrl);
    
    // Actualizar el usuario con la foto
    await prisma.user.update({
      where: { id: instructor.userId },
      data: { profilePictureUrl: testPhotoUrl }
    });
    
    console.log('✅ Foto actualizada exitosamente!\n');
    
    // Verificar actualización
    const updatedUser = await prisma.user.findUnique({
      where: { id: instructor.userId }
    });
    
    console.log('📸 Foto de perfil verificada:');
    console.log(`   ${updatedUser.profilePictureUrl}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testProfilePicture();
