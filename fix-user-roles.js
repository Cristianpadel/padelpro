// fix-user-roles.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserRoles() {
  try {
    console.log('🔧 Fixing user roles...');
    
    // First, let's try to connect and get the raw data using $queryRaw
    const users = await prisma.$queryRaw`SELECT id, name, email, role FROM User`;
    
    console.log('Current users found:');
    users.forEach(user => {
      console.log(`- ${user.name} (${user.email}) - Role: "${user.role}"`);
    });
    
    // Update any problematic roles
    const problematicRoles = ['ADMIN', 'INSTRUCTOR', 'MANAGER'];
    
    for (const user of users) {
      if (problematicRoles.includes(user.role)) {
        console.log(`🔄 Updating ${user.name} role from "${user.role}" to "PLAYER"...`);
        
        await prisma.$executeRaw`
          UPDATE User 
          SET role = 'PLAYER' 
          WHERE id = ${user.id}
        `;
        
        console.log(`✅ Updated ${user.name}`);
      }
    }
    
    console.log('✅ Role fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserRoles();