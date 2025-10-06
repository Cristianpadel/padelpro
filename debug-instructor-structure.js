// debug-instructor-structure.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugInstructorStructure() {
  try {
    console.log('🔍 Checking existing instructors structure...');
    
    const instructor = await prisma.instructor.findFirst();
    if (instructor) {
      console.log('✅ Sample instructor structure:');
      console.log(JSON.stringify(instructor, null, 2));
    } else {
      console.log('❌ No instructors found, checking what fields are available...');
      
      // Intentar crear un instructor simple para ver qué campos faltan
      try {
        await prisma.instructor.create({
          data: {
            userId: 'test-user-id',
            clubId: 'test-club-id'
          }
        });
      } catch (error) {
        console.log('Error details:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

debugInstructorStructure();