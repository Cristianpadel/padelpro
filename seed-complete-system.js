const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedCompleteSystem() {
  try {
    console.log('🌱 === SEEDING COMPLETE PADELPRO SYSTEM ===');
    
    // 1. CREAR CLUB
    console.log('🏢 Creando club...');
    const club = await prisma.club.upsert({
      where: { id: 'club-1' },
      update: {},
      create: {
        id: 'club-1',
        name: 'Club Padel Pro'
      }
    });
    console.log('✅ Club creado:', club.name);

    // 2. CREAR CANCHAS
    console.log('🏟️ Creando canchas...');
    const courts = [];
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.upsert({
        where: { id: `court-${i}` },
        update: {},
        create: {
          id: `court-${i}`,
          number: i,
          clubId: club.id
        }
      });
      courts.push(court);
    }
    console.log(`✅ ${courts.length} canchas creadas`);

    // 3. CREAR INSTRUCTORES
    console.log('👨‍🏫 Creando instructores...');
    const instructorData = [
      { id: 'instructor-1', name: 'Carlos Martínez', specialty: 'Técnica y fundamentos' },
      { id: 'instructor-2', name: 'Ana López', specialty: 'Juego táctico' },
      { id: 'instructor-3', name: 'Miguel Rodríguez', specialty: 'Alto rendimiento' },
      { id: 'instructor-4', name: 'Sofia García', specialty: 'Iniciación' }
    ];

    const instructors = [];
    for (const instrData of instructorData) {
      const instructor = await prisma.instructor.upsert({
        where: { id: instrData.id },
        update: {},
        create: {
          id: instrData.id,
          name: instrData.name,
          clubId: club.id
        }
      });
      instructors.push(instructor);
    }
    console.log(`✅ ${instructors.length} instructores creados`);

    // 4. CREAR USUARIOS DE PRUEBA
    console.log('👥 Creando usuarios de prueba...');
    const users = [];
    const userDataArray = [
      { id: 'user-1', name: 'María García', email: 'maria@test.com', level: 'inicial-medio', credit: 100 },
      { id: 'user-2', name: 'Juan Pérez', email: 'juan@test.com', level: 'avanzado', credit: 150 },
      { id: 'user-3', name: 'Ana Martín', email: 'ana@test.com', level: 'principiante', credit: 80 },
      { id: 'user-4', name: 'Carlos López', email: 'carlos@test.com', level: 'intermedio', credit: 120 }
    ];

    for (const userData of userDataArray) {
      const user = await prisma.user.upsert({
        where: { id: userData.id },
        update: {},
        create: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          level: userData.level,
          credit: userData.credit,
          role: 'PLAYER'
        }
      });
      users.push(user);
    }
    console.log(`✅ ${users.length} usuarios creados`);

    console.log('\n🎉 Sistema base completado exitosamente!');
    console.log(`📊 Resumen:`);
    console.log(`   🏢 Club: ${club.name}`);
    console.log(`   🏟️ Canchas: ${courts.length}`);
    console.log(`   👨‍🏫 Instructores: ${instructors.length}`);
    console.log(`   👥 Usuarios: ${users.length}`);

    return { club, courts, instructors, users };
    
  } catch (error) {
    console.error('❌ Error en seed:', error);
    throw error;
  }
}

seedCompleteSystem().finally(() => prisma.$disconnect());