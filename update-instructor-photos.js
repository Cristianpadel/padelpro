const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateInstructorPhotos() {
  try {
    console.log('🔍 Buscando instructores sin foto...');
    
    // Actualizar Alex García con una foto específica
    const alexUpdate = await prisma.user.updateMany({
      where: {
        name: 'Alex García',
        profilePictureUrl: null
      },
      data: {
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/32.jpg'
      }
    });
    
    console.log('✅ Alex García actualizado:', alexUpdate.count);
    
    // Actualizar Carlos Instructor con una foto diferente
    const carlosUpdate = await prisma.user.updateMany({
      where: {
        name: 'Carlos Instructor',
        profilePictureUrl: null
      },
      data: {
        profilePictureUrl: 'https://randomuser.me/api/portraits/men/45.jpg'
      }
    });
    
    console.log('✅ Carlos Instructor actualizado:', carlosUpdate.count);
    
    // Verificar todos los instructores
    const instructors = await prisma.instructor.findMany({
      include: {
        user: true
      }
    });
    
    console.log('\n📋 Lista de instructores:');
    instructors.forEach(i => {
      console.log(`  - ${i.user.name}: ${i.user.profilePictureUrl ? '✅ Con foto' : '❌ Sin foto'}`);
    });
    
    console.log('\n✅ Actualización completada!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateInstructorPhotos();
