const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function showLoginCredentials() {
  try {
    console.log('🔐 Credenciales de acceso para usuarios de prueba\n');
    console.log('═'.repeat(60));
    
    const users = await prisma.user.findMany({
      where: {
        clubId: 'club-padel-estrella',
        role: 'PLAYER'
      },
      select: {
        id: true,
        name: true,
        email: true,
        level: true,
        credits: true
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    console.log('\n📋 USUARIOS DISPONIBLES EN PADEL ESTRELLA:\n');
    
    users.forEach((user, i) => {
      console.log(`${i + 1}. 👤 ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🏆 Nivel: ${user.level}`);
      console.log(`   💰 Créditos: ${user.credits}€`);
      console.log(`   🔑 Contraseña: password123 (temporal)`);
      console.log('');
    });
    
    console.log('═'.repeat(60));
    console.log('\n💡 INSTRUCCIONES PARA INICIAR SESIÓN:');
    console.log('   1. Ve a la página de login');
    console.log('   2. Usa cualquiera de los emails de arriba');
    console.log('   3. Contraseña: password123');
    console.log('\n⚠️  NOTA: Actualmente no hay sistema de login implementado.');
    console.log('   Estás usando el panel de administración directamente.');
    console.log('   Para ver los datos de un usuario, selecciónalo en el panel.\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showLoginCredentials();
