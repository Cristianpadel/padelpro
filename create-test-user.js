const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    const testUser = await prisma.user.upsert({
      where: { email: 'alex@padel.com' },
      update: {},
      create: {
        email: 'alex@padel.com',
        name: 'Alex García'
      }
    });
    
    console.log('Usuario de prueba creado/actualizado:', JSON.stringify(testUser, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
