// create-fresh-user.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createFreshUser() {
  try {
    console.log('👤 Creating fresh user for instructor form...');
    
    const userId = `user-fresh-instructor-${Date.now()}`;
    const email = `fresh-instructor-${Date.now()}@example.com`;
    const name = `María Instructora ${Date.now()}`;
    
    await prisma.$executeRaw`
      INSERT INTO User (id, email, name, clubId, level, role, preference, visibility, credits, createdAt, updatedAt)
      VALUES (${userId}, ${email}, ${name}, 'club-1', 'avanzado', 'PLAYER', 'NORMAL', 'PUBLIC', 0, datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Fresh user created:', {
      id: userId,
      email: email,
      name: name
    });
    
    console.log('\n🎯 You can now use this user in the form:');
    console.log(`   Name: ${name}`);
    console.log(`   Email: ${email}`);
    console.log(`   ID: ${userId}`);
    
    return { userId, email, name };
    
  } catch (error) {
    console.error('❌ Error creating fresh user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createFreshUser();