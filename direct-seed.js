const { PrismaClient } = require('@prisma/client');

async function createDirectSeed() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🌱 Creating seed data directly...');
    
    // Create club
    console.log('🏢 Creating club...');
    const club = await prisma.club.create({
      data: {
        name: 'Club Padel Pro'
      }
    });
    console.log('✅ Club created:', club.name);

    // Create courts
    console.log('🏟️ Creating courts...');
    const courts = [];
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          number: i,
          clubId: club.id
        }
      });
      courts.push(court);
      console.log(`✅ Court ${i} created`);
    }

    // Create instructors
    console.log('👨‍🏫 Creating instructors...');
    const instructors = [];
    const instructorNames = ['Carlos Martínez', 'Ana López', 'Miguel Rodríguez', 'Sofia García'];
    for (const name of instructorNames) {
      const instructor = await prisma.instructor.create({
        data: {
          name,
          clubId: club.id
        }
      });
      instructors.push(instructor);
      console.log(`✅ Instructor created: ${name}`);
    }

    // Create test users
    console.log('👥 Creating test users...');
    const users = [];
    const userData = [
      { name: 'María García', email: 'maria@test.com', level: 'inicial-medio' },
      { name: 'Juan Pérez', email: 'juan@test.com', level: 'avanzado' },
      { name: 'Ana Martín', email: 'ana@test.com', level: 'principiante' },
      { name: 'Carlos López', email: 'carlos@test.com', level: 'intermedio' }
    ];

    for (const data of userData) {
      const user = await prisma.user.create({
        data: {
          name: data.name,
          email: data.email,
          level: data.level,
          role: 'PLAYER',
          credit: 100
        }
      });
      users.push(user);
      console.log(`✅ User created: ${data.name}`);
    }

    console.log('\n🎉 Seed data created successfully!');
    console.log(`📊 Summary:`);
    console.log(`   🏢 Club: ${club.name}`);
    console.log(`   🏟️ Courts: ${courts.length}`);
    console.log(`   👨‍🏫 Instructors: ${instructors.length}`);
    console.log(`   👥 Users: ${users.length}`);

    return { club, courts, instructors, users };
    
  } catch (error) {
    console.error('❌ Error creating seed data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createDirectSeed();