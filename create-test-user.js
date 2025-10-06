const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('👤 Creating test instructor user...');
    
    const userId = `user-test-instructor-${Date.now()}`;
    const email = 'new-instructor@example.com';
    const name = 'Carlos Instructor';
    
    await prisma.$executeRaw`
      INSERT INTO User (id, email, name, clubId, level, role, preference, visibility, credits, createdAt, updatedAt)
      VALUES (${userId}, ${email}, ${name}, 'club-1', 'intermedio', 'PLAYER', 'NORMAL', 'PUBLIC', 0, datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Test instructor user created:', {
      id: userId,
      email: email,
      name: name
    });
    
    return userId;
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();
