import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testAndSeed() {
  console.log('🧪 Testing Prisma models and seeding basic data...');

  try {
    // Test available models
    console.log('📋 Testing available models:');
    
    // Test club operations
    const club = await prisma.club.upsert({
      where: { id: 'club-1' },
      update: {},
      create: {
        id: 'club-1',
        name: 'Padel Estrella'
      }
    });
    console.log('✅ Club created/found:', club.name);

    // Test court operations
    const courts = await Promise.all([1, 2, 3, 4].map(async (number) => {
      return await prisma.court.upsert({
        where: { id: `court-${number}` },
        update: {},
        create: {
          id: `court-${number}`,
          number,
          clubId: club.id
        }
      });
    }));
    console.log('✅ Courts created:', courts.length);

    // Test user operations
    const users = await Promise.all([
      { id: 'user-1', email: 'juan@example.com', name: 'Juan Pérez' },
      { id: 'user-2', email: 'maria@example.com', name: 'María García' },
      { id: 'user-3', email: 'carlos@example.com', name: 'Carlos López' }
    ].map(async (userData) => {
      return await prisma.user.upsert({
        where: { id: userData.id },
        update: {},
        create: userData
      });
    }));
    console.log('✅ Users created:', users.length);

    // Check what properties are available on prisma
    console.log('📊 Available Prisma client properties:');
    const availableModels = Object.getOwnPropertyNames(prisma)
      .filter(prop => 
        !prop.startsWith('$') && 
        !prop.startsWith('_') && 
        typeof (prisma as any)[prop] === 'object' &&
        (prisma as any)[prop] !== null
      );
    console.log('Available models:', availableModels);

    // También verificar propiedades en mayúsculas (constructores de modelos)
    const modelConstructors = Object.getOwnPropertyNames(prisma)
      .filter(prop => prop[0] === prop[0].toUpperCase() && prop !== 'constructor');
    console.log('Model constructors found:', modelConstructors);

    console.log('🎉 Basic seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during operation:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testAndSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});
