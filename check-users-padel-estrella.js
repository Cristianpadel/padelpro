const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios en la base de datos...\n');
    
    // Total de usuarios
    const totalUsers = await prisma.user.count();
    console.log(`📊 Total usuarios en la BD: ${totalUsers}\n`);
    
    // Usuarios de Padel Estrella
    const padelEstrellaUsers = await prisma.user.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        clubId: true
      }
    });
    
    console.log(`🏢 Usuarios de Padel Estrella: ${padelEstrellaUsers.length}\n`);
    
    if (padelEstrellaUsers.length > 0) {
      padelEstrellaUsers.forEach((user, i) => {
        console.log(`${i + 1}. ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Role: ${user.role}`);
        console.log(`   Club ID: ${user.clubId}`);
        console.log('');
      });
    } else {
      console.log('❌ No hay usuarios de Padel Estrella');
    }
    
    // Usuarios por role
    console.log('\n📋 Usuarios por rol:');
    const roles = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    roles.forEach(role => {
      console.log(`   ${role.role}: ${role._count.role} usuarios`);
    });
    
    // Usuarios PLAYER (clientes) de Padel Estrella
    console.log('\n👥 Clientes (PLAYER) de Padel Estrella:');
    const clients = await prisma.user.findMany({
      where: {
        clubId: 'club-padel-estrella',
        role: 'PLAYER'
      }
    });
    
    console.log(`   Total: ${clients.length}`);
    
    if (clients.length === 0) {
      console.log('\n⚠️ No hay clientes registrados en Padel Estrella!');
      console.log('💡 Necesitas crear usuarios con role PLAYER para ese club.');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
