// verify-new-user.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyNewUser() {
  try {
    // Get the newly created user
    const newUser = await prisma.$queryRaw`
      SELECT id, name, email, level, genderCategory, role, createdAt 
      FROM User 
      WHERE email = 'test.registration@example.com'
    `;
    
    if (Array.isArray(newUser) && newUser.length > 0) {
      console.log('✅ User successfully created in database:');
      console.log(JSON.stringify(newUser[0], null, 2));
      
      // Verify all required fields are present
      const user = newUser[0];
      const checks = [
        { field: 'genderCategory', value: user.genderCategory, expected: 'masculino' },
        { field: 'level', value: user.level, expected: 'intermedio' },
        { field: 'role', value: user.role, expected: 'PLAYER' },
        { field: 'name', value: user.name, expected: 'Test User Registration' },
        { field: 'email', value: user.email, expected: 'test.registration@example.com' }
      ];
      
      console.log('\n🔍 Field verification:');
      checks.forEach(check => {
        const status = check.value === check.expected ? '✅' : '❌';
        console.log(`${status} ${check.field}: ${check.value} ${check.value === check.expected ? '(correct)' : `(expected: ${check.expected})`}`);
      });
      
    } else {
      console.log('❌ User not found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifyNewUser();