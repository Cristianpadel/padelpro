// check-user-roles.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserRoles() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        email: true
      }
    });
    
    console.log('Users in database:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: "${user.role}"`);
    });
    
    console.log('\nUnique roles found:');
    const uniqueRoles = [...new Set(users.map(u => u.role))];
    uniqueRoles.forEach(role => {
      console.log(`- "${role}"`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserRoles();