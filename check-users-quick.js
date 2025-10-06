const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('👥 Usuarios en la base de datos:');
    const users = await prisma.user.findMany();
    
    if (users.length === 0) {
      console.log('❌ No hay usuarios en la base de datos');
    } else {
      users.forEach(u => {
        console.log(`  - ${u.id}: ${u.name} (${u.email})`);
      });
    }
    
    console.log(`\n📊 Total: ${users.length} usuarios`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();