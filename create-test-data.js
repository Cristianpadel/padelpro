const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestData() {
  console.log('🚀 Creating basic test data...');
  
  // Check existing club
  const club = await prisma.club.findUnique({
    where: { id: 'club-1' }
  });
  console.log('🏢 Using existing club:', club?.name || 'Club not found');
  
  // Check existing courts
  const existingCourts = await prisma.$queryRaw`SELECT id, clubId, number FROM Court WHERE clubId = 'club-1'`;
  console.log(`🎾 Found ${existingCourts.length} existing courts`);
  
  // Create test users for instructors
  const user1 = await prisma.user.upsert({
    where: { email: 'instructor1@test.com' },
    update: {},
    create: {
      email: 'instructor1@test.com',
      name: 'Carlos Instructor',
      role: 'INSTRUCTOR'
    }
  });
  
  const user2 = await prisma.user.upsert({
    where: { email: 'instructor2@test.com' },
    update: {},
    create: {
      email: 'instructor2@test.com',
      name: 'Ana Profesora',
      role: 'INSTRUCTOR'
    }
  });
  
  // Create instructors using raw SQL
  await prisma.$executeRaw`
    INSERT OR REPLACE INTO Instructor (id, userId, name, clubId, isActive, createdAt, updatedAt)
    VALUES ('instructor-1', ${user1.id}, 'Carlos Instructor', 'club-1', 1, datetime('now'), datetime('now'))
  `;
  
  await prisma.$executeRaw`
    INSERT OR REPLACE INTO Instructor (id, userId, name, clubId, isActive, createdAt, updatedAt)  
    VALUES ('instructor-2', ${user2.id}, 'Ana Profesora', 'club-1', 1, datetime('now'), datetime('now'))
  `;
  
  console.log('👨‍🏫 Created 2 instructors');
  
  console.log('✅ Test data created successfully!');
  await prisma.$disconnect();
}

createTestData().catch(console.error);