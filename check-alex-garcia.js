const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAlexGarcia() {
  try {
    console.log('🔍 Buscando usuario Alex García...\n');
    
    // Buscar por email
    const user = await prisma.user.findUnique({
      where: { email: 'alex.garcia@email.com' }
    });
    
    if (user) {
      console.log('✅ Usuario encontrado:');
      console.log(`   ID: ${user.id}`);
      console.log(`   Nombre: ${user.name}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Club: ${user.clubId}`);
      console.log(`   Nivel: ${user.level}`);
      console.log(`   Créditos: ${user.credits}`);
    } else {
      console.log('❌ Usuario NO encontrado con email: alex.garcia@email.com\n');
      console.log('💡 Creando usuario Alex García...\n');
      
      const newUser = await prisma.user.create({
        data: {
          email: 'alex.garcia@email.com',
          name: 'Alex García',
          clubId: 'club-padel-estrella',
          role: 'PLAYER',
          level: '3.5',
          position: 'Derecha',
          credits: 125,
          profilePictureUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex%20Garcia'
        }
      });
      
      console.log('✅ Usuario creado:');
      console.log(`   ID: ${newUser.id}`);
      console.log(`   Nombre: ${newUser.name}`);
      console.log(`   Email: ${newUser.email}`);
    }
    
    console.log('\n📝 CREDENCIALES DE ACCESO:');
    console.log('─────────────────────────────');
    console.log('Email: alex.garcia@email.com');
    console.log('Contraseña: padel123');
    console.log('─────────────────────────────');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkAlexGarcia();
