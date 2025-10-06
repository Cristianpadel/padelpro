const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        clubId: true
      }
    });
    
    console.log('👥 Usuarios disponibles:');
    users.forEach((user, i) => {
      console.log(`  ${i+1}. ${user.name} (${user.email}) - ID: ${user.id} - Club: ${user.clubId}`);
    });
    
    // También verificar si hay usuarios del club Padel Estrella
    const estrellaUsers = await prisma.user.findMany({
      where: {
        clubId: 'cmftnbe2o0001tgkobtrxipip' // ID del club Padel Estrella
      },
      select: {
        id: true,
        name: true,
        email: true
      }
    });
    
    console.log('\n⭐ Usuarios del club Padel Estrella:');
    if (estrellaUsers.length > 0) {
      estrellaUsers.forEach((user, i) => {
        console.log(`  ${i+1}. ${user.name} (${user.email}) - ID: ${user.id}`);
      });
    } else {
      console.log('  No hay usuarios en el club Padel Estrella');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();