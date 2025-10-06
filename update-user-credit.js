const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateUserCredit() {
  try {
    const updated = await prisma.user.update({
      where: { id: 'user-alex-test' },
      data: { credits: 200.0 }
    });
    console.log('✅ Crédito actualizado:', updated.credits, '€');
    console.log('Usuario:', updated.name);
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateUserCredit();