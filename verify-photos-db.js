const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verifyPhotosInDB() {
  try {
    console.log('🔍 Verificando fotos en la base de datos...\n');
    
    const users = await prisma.user.findMany({
      where: {
        role: 'INSTRUCTOR',
        clubId: 'club-padel-estrella'
      },
      select: {
        id: true,
        name: true,
        email: true,
        profilePictureUrl: true
      }
    });
    
    console.log(`📊 Total usuarios instructores: ${users.length}\n`);
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Foto: ${user.profilePictureUrl ? '✅ SÍ' : '❌ NO'}`);
      if (user.profilePictureUrl) {
        console.log(`   URL: ${user.profilePictureUrl}`);
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyPhotosInDB();
