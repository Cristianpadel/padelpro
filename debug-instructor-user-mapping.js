// debug-instructor-user-mapping.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugInstructorUserMapping() {
  try {
    console.log('🔍 Checking instructor-user mapping...\n');
    
    // Get all instructors with their details
    const instructors = await prisma.$queryRaw`
      SELECT * FROM Instructor ORDER BY createdAt DESC
    `;
    
    console.log(`📋 Found ${instructors.length} instructors:\n`);
    
    for (let i = 0; i < instructors.length; i++) {
      const instructor = instructors[i];
      console.log(`${i + 1}. Instructor ID: ${instructor.id}`);
      console.log(`   User ID: ${instructor.userId}`);
      console.log(`   Club ID: ${instructor.clubId}`);
      console.log(`   Specialties: ${instructor.specialties || 'None'}`);
      console.log(`   Years Experience: ${instructor.yearsExperience}`);
      console.log(`   Active: ${instructor.isActive}`);
      
      // Try to get the user details
      try {
        const users = await prisma.$queryRaw`
          SELECT * FROM User WHERE id = ${instructor.userId}
        `;
        
        if (users.length > 0) {
          const user = users[0];
          console.log(`   👤 User Name: ${user.name}`);
          console.log(`   📧 User Email: ${user.email}`);
          console.log(`   🏢 User Club: ${user.clubId}`);
        } else {
          console.log(`   ❌ User not found for userId: ${instructor.userId}`);
        }
      } catch (error) {
        console.log(`   ❌ Error getting user: ${error.message}`);
      }
      
      // Try to get club details
      try {
        const clubs = await prisma.$queryRaw`
          SELECT * FROM Club WHERE id = ${instructor.clubId}
        `;
        
        if (clubs.length > 0) {
          const club = clubs[0];
          console.log(`   🏟️ Club Name: ${club.name}`);
        } else {
          console.log(`   ❌ Club not found for clubId: ${instructor.clubId}`);
        }
      } catch (error) {
        console.log(`   ❌ Error getting club: ${error.message}`);
      }
      
      console.log('   ---\n');
    }
    
    // Also check what's in the User table
    console.log('\n👥 All users in database:');
    const allUsers = await prisma.$queryRaw`
      SELECT id, name, email, role FROM User ORDER BY createdAt DESC
    `;
    
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugInstructorUserMapping();