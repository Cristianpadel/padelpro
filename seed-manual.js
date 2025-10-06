const { PrismaClient } = require('@prisma/client');
const { randomBytes } = require('crypto');

// Función para generar CUID manualmente
function generateCuid() {
  return 'c' + randomBytes(12).toString('base64')
    .replace(/\//g, '_')
    .replace(/\+/g, '-')
    .substring(0, 24);
}

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test clubs con ID manual
    const club1 = await prisma.club.create({
      data: {
        id: generateCuid(),
        name: 'Padel Estrella',
        address: 'Calle del Deporte 123, Madrid',
        phone: '+34 91 123 4567',
        email: 'info@padelestrella.com',
        website: 'https://padelestrella.com',
        description: 'Club de pádel premium con instalaciones modernas y profesores certificados.'
      }
    });

    const club2 = await prisma.club.create({
      data: {
        id: generateCuid(),
        name: 'Padel Club Mallorca',
        address: 'Avenida Marina 45, Palma',
        phone: '+34 971 987 654',
        email: 'contacto@padelclubmallorca.es',
        website: 'https://padelclubmallorca.es',
        description: 'El mejor club de pádel en Mallorca, con vistas al mar y ambiente familiar.'
      }
    });

    const club3 = await prisma.club.create({
      data: {
        id: generateCuid(),
        name: 'Club de Prueba',
        address: 'Calle Test 1, Barcelona',
        phone: '+34 93 555 0000',
        email: 'test@clubprueba.com',
        description: 'Club de prueba para desarrollo y testing.'
      }
    });

    console.log('✅ Clubs created:', [club1.name, club2.name, club3.name]);

    // Create courts for each club
    const courts = [];

    // Courts for Padel Estrella
    for (let i = 1; i <= 4; i++) {
      const court = await prisma.court.create({
        data: {
          id: generateCuid(),
          name: `Pista ${i}`,
          clubId: club1.id,
          capacity: 4,
          isActive: true
        }
      });
      courts.push(court);
    }

    // Courts for Padel Club Mallorca
    for (let i = 1; i <= 6; i++) {
      const court = await prisma.court.create({
        data: {
          id: generateCuid(),
          name: `Pista ${i}`,
          clubId: club2.id,
          capacity: 4,
          isActive: true
        }
      });
      courts.push(court);
    }

    // Courts for Club de Prueba
    for (let i = 1; i <= 2; i++) {
      const court = await prisma.court.create({
        data: {
          id: generateCuid(),
          name: `Pista Test ${i}`,
          clubId: club3.id,
          capacity: 4,
          isActive: true
        }
      });
      courts.push(court);
    }

    console.log(`✅ Created ${courts.length} courts total`);

    // Create some test users
    const users = [];
    
    const testUsers = [
      {
        id: generateCuid(),
        name: 'Admin Usuario',
        email: 'admin@padelestrella.com',
        phone: '+34 600 111 111',
        clubId: club1.id
      },
      {
        id: generateCuid(),
        name: 'Manager Mallorca',
        email: 'manager@padelclubmallorca.es',
        phone: '+34 600 222 222',
        clubId: club2.id
      },
      {
        id: generateCuid(),
        name: 'Test User',
        email: 'test@clubprueba.com',
        phone: '+34 600 333 333',
        clubId: club3.id
      },
      {
        id: generateCuid(),
        name: 'Juan Pérez',
        email: 'juan@example.com',
        phone: '+34 600 444 444',
        clubId: club1.id
      },
      {
        id: generateCuid(),
        name: 'María García',
        email: 'maria@example.com',
        phone: '+34 600 555 555',
        clubId: club2.id
      }
    ];

    for (const userData of testUsers) {
      const user = await prisma.user.create({
        data: userData
      });
      users.push(user);
    }

    console.log(`✅ Created ${users.length} test users`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- Clubs: 3`);
    console.log(`- Courts: ${courts.length}`);
    console.log(`- Users: ${users.length}`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });