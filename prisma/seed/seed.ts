import { PrismaClient } from '@prisma/client';
import { seedClasses, cleanClasses } from './classes.seed';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Primero necesitamos crear usuarios básicos si no existen
    await seedBasicData();
    
    // Luego crear las clases
    await seedClasses();
    
    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function seedBasicData() {
  console.log('👥 Seeding basic data...');

  // Crear club si no existe
  await prisma.club.upsert({
    where: { id: 'club-1' },
    update: {},
    create: {
      id: 'club-1',
      name: 'Padel Estrella'
    }
  });

  // Crear pistas si no existen
  const courtsData = [
    { id: 'court-1', number: 1, clubId: 'club-1' },
    { id: 'court-2', number: 2, clubId: 'club-1' },
    { id: 'court-3', number: 3, clubId: 'club-1' },
    { id: 'court-4', number: 4, clubId: 'club-1' }
  ];

  for (const court of courtsData) {
    await prisma.court.upsert({
      where: { id: court.id },
      update: {},
      create: court
    });
  }

  // Crear usuarios de ejemplo si no existen
  const usersData = [
    {
      id: 'user-1',
      email: 'juan@example.com',
      name: 'Juan Pérez'
    },
    {
      id: 'user-2', 
      email: 'maria@example.com',
      name: 'María García'
    },
    {
      id: 'user-3',
      email: 'carlos@example.com', 
      name: 'Carlos López'
    }
  ];

  for (const user of usersData) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: user
    });
  }

  console.log('✅ Basic data seeded successfully!');
}

async function cleanup() {
  console.log('🧹 Cleaning database...');
  
  try {
    await cleanClasses();
    await prisma.court.deleteMany();
    await prisma.club.deleteMany();
    await prisma.user.deleteMany();
    
    console.log('✅ Database cleaned successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar el script
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clean') {
    cleanup().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  } else {
    main().catch((e) => {
      console.error(e);
      process.exit(1);
    });
  }
}

export { main as seed, cleanup };
