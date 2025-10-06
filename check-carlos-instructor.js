// check-carlos-instructor.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCarlosInstructor() {
  try {
    console.log('🔍 Checking if Carlos Instructor already has instructor profile...');
    
    // Find Carlos user
    const carlosUser = await prisma.$queryRaw`
      SELECT * FROM User WHERE name LIKE '%Carlos%' OR email LIKE '%new-instructor%'
    `;
    
    console.log('📋 Carlos user(s) found:', carlosUser.length);
    carlosUser.forEach(user => {
      console.log(`- ID: ${user.id}, Name: ${user.name}, Email: ${user.email}`);
    });
    
    if (carlosUser.length > 0) {
      const userId = carlosUser[0].id;
      
      // Check if instructor exists for this user
      const instructors = await prisma.$queryRaw`
        SELECT * FROM Instructor WHERE userId = ${userId}
      `;
      
      console.log(`📋 Instructors found for ${carlosUser[0].name}:`, instructors.length);
      instructors.forEach(instructor => {
        console.log(`- Instructor ID: ${instructor.id}, ClubId: ${instructor.clubId}`);
      });
      
      if (instructors.length === 0) {
        console.log('✅ User can be converted to instructor');
      } else {
        console.log('❌ User already has instructor profile');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCarlosInstructor();