const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createBasicData() {
  try {
    console.log('🌱 Creating basic seed data...');
    
    // Create club
    const club = await prisma.club.create({
      data: {
        name: 'Club Padel Pro'
      }
    });
    console.log('✅ Club created:', club.name);

    // Create courts
    const courts = [];
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          number: i,
          clubId: club.id
        }
      });
      courts.push(court);
    }
    console.log(`✅ ${courts.length} courts created`);

    // Create instructors
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
    }
    console.log(`✅ ${instructors.length} instructors created`);

    // Create test users
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
    }
    console.log(`✅ ${users.length} users created`);

    console.log('\n🎉 Basic data created successfully!');
    return { club, courts, instructors, users };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createBasicData().finally(() => prisma.$disconnect());