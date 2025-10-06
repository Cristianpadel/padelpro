// create-instructor-direct.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createInstructorDirect() {
  try {
    console.log('🔍 Creating instructor directly...');
    
    const userId = 'user-instructor-estrella';
    const clubId = 'club-padel-estrella';
    const specialties = 'Pádel Profesional';
    const yearsExperience = 3;
    const instructorId = `instructor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.log('📋 Data to insert:', {
      id: instructorId,
      userId,
      clubId,
      specialties,
      yearsExperience
    });

    // Use raw SQL to insert
    await prisma.$executeRaw`
      INSERT INTO Instructor (id, userId, clubId, specialties, yearsExperience, hourlyRate, isActive, createdAt, updatedAt)
      VALUES (${instructorId}, ${userId}, ${clubId}, ${specialties}, ${yearsExperience}, 30.0, 1, datetime('now'), datetime('now'))
    `;
    
    console.log('✅ Instructor created successfully');
    
    // Verify by querying directly
    const result = await prisma.$queryRaw`
      SELECT * FROM Instructor WHERE id = ${instructorId}
    `;
    
    console.log('📋 Created instructor:', result);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createInstructorDirect();