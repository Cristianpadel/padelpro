// check-existing-instructors.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    console.log('🔍 Checking existing instructors...');
    
    const result = await prisma.$queryRaw`
      SELECT * FROM Instructor
    `;
    
    console.log('📋 Found instructors:', result.length);
    result.forEach((instructor, index) => {
      console.log(`${index + 1}. ID: ${instructor.id}`);
      console.log(`   UserId: ${instructor.userId}`);
      console.log(`   ClubId: ${instructor.clubId}`);
      console.log(`   Specialties: ${instructor.specialties}`);
      console.log(`   Years: ${instructor.yearsExperience}`);
      console.log('   ---');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors();