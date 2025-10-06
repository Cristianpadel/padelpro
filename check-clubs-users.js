const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkClubs() {
  try {
    console.log('=== CLUBES EN LA BASE DE DATOS ===');
    const clubs = await prisma.club.findMany({
      include: {
        admin: true,
        users: { take: 3 }
      }
    });
    
    clubs.forEach(club => {
      console.log(`Club ID: ${club.id}`);
      console.log(`Nombre: ${club.name}`);
      console.log(`Admin: ${club.admin.name} (${club.admin.email})`);
      console.log(`Usuarios: ${club.users.length} registrados`);
      console.log('---');
    });
    
    console.log('=== USUARIOS CON ACCESO ESTRELLA ===');
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'estrella' } },
          { name: { contains: 'Estrella' } },
          { name: { contains: 'estrella' } }
        ]
      },
      include: { club: true }
    });
    
    if (users.length === 0) {
      console.log('No se encontraron usuarios con "estrella" en el nombre o email');
      
      console.log('=== TODOS LOS USUARIOS ===');
      const allUsers = await prisma.user.findMany({
        include: { club: true },
        take: 10
      });
      
      allUsers.forEach(user => {
        console.log(`Usuario: ${user.name} (${user.email})`);
        console.log(`Club: ${user.club.name}`);
        console.log(`Club ID: ${user.clubId}`);
        console.log('---');
      });
    } else {
      users.forEach(user => {
        console.log(`Usuario: ${user.name} (${user.email})`);
        console.log(`Club: ${user.club.name}`);
        console.log(`Club ID: ${user.clubId}`);
        console.log('---');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkClubs();