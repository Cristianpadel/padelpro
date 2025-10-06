const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    console.log('🔍 Checking all instructors in database...\n');

    // Usar raw SQL para obtener todos los instructors
    const instructorsRaw = await prisma.$queryRaw`
      SELECT * FROM Instructor
    `;

    console.log('📊 Raw instructors from database:');
    console.log(JSON.stringify(instructorsRaw, null, 2));
    console.log(`\n✅ Total instructors found: ${instructorsRaw.length}\n`);

    // Verificar relación con clubes
    for (const instructor of instructorsRaw) {
      console.log(`👨‍🏫 Instructor: ${instructor.name}`);
      console.log(`   - ID: ${instructor.id}`);
      console.log(`   - Club ID: ${instructor.clubId}`);
      console.log(`   - Specialty: ${instructor.specialty}`);
      console.log(`   - Experience: ${instructor.experienceYears} years`);
      console.log(`   - Rating: ${instructor.rating}/5`);
      console.log(`   - Created: ${instructor.createdAt}`);
      
      // Obtener info del club
      const club = await prisma.$queryRaw`
        SELECT name FROM Club WHERE id = ${instructor.clubId}
      `;
      
      if (club.length > 0) {
        console.log(`   - Club: ${club[0].name}\n`);
      } else {
        console.log(`   - Club: ❌ NOT FOUND\n`);
      }
    }

    // Verificar qué devuelve la API
    console.log('🔗 Testing API endpoint...');
    
    // Simular el endpoint actual
    const apiResult = await prisma.$queryRaw`
      SELECT 
        i.id,
        i.name,
        i.specialty,
        i.experienceYears,
        i.rating,
        i.clubId,
        c.name as clubName
      FROM Instructor i
      LEFT JOIN Club c ON i.clubId = c.id
      ORDER BY i.name ASC
    `;

    console.log('\n📡 API would return:');
    console.log(JSON.stringify(apiResult, null, 2));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkInstructors();