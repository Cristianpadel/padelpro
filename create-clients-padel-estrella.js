const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    console.log('🎭 Creando usuarios de prueba para Padel Estrella...\n');
    
    const testUsers = [
      {
        name: 'Juan Pérez',
        email: 'juan.perez@example.com',
        level: '3.0',
        position: 'Derecha'
      },
      {
        name: 'María González',
        email: 'maria.gonzalez@example.com',
        level: '2.5',
        position: 'Revés'
      },
      {
        name: 'Pedro Sánchez',
        email: 'pedro.sanchez@example.com',
        level: '4.0',
        position: 'Derecha'
      },
      {
        name: 'Laura Martínez',
        email: 'laura.martinez@example.com',
        level: '3.5',
        position: 'Derecha'
      },
      {
        name: 'Roberto García',
        email: 'roberto.garcia@example.com',
        level: '2.0',
        position: 'Revés'
      },
      {
        name: 'Carmen López',
        email: 'carmen.lopez@example.com',
        level: '3.0',
        position: 'Derecha'
      },
      {
        name: 'Antonio Ruiz',
        email: 'antonio.ruiz@example.com',
        level: '4.5',
        position: 'Derecha'
      },
      {
        name: 'Isabel Fernández',
        email: 'isabel.fernandez@example.com',
        level: '3.5',
        position: 'Revés'
      },
      {
        name: 'Francisco Jiménez',
        email: 'francisco.jimenez@example.com',
        level: '2.5',
        position: 'Derecha'
      },
      {
        name: 'Ana María Torres',
        email: 'ana.torres@example.com',
        level: '3.0',
        position: 'Revés'
      }
    ];
    
    let created = 0;
    
    for (const userData of testUsers) {
      // Verificar si ya existe
      const existing = await prisma.user.findUnique({
        where: { email: userData.email }
      });
      
      if (existing) {
        console.log(`⚠️ ${userData.name} ya existe`);
        continue;
      }
      
      // Crear usuario
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          name: userData.name,
          clubId: 'club-padel-estrella',
          role: 'PLAYER',
          level: userData.level,
          position: userData.position,
          credits: 100, // Créditos iniciales
          profilePictureUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(userData.name)}`
        }
      });
      
      console.log(`✅ ${user.name} creado (Nivel: ${user.level})`);
      created++;
    }
    
    console.log(`\n✨ ${created} usuarios creados exitosamente!`);
    
    // Verificar total
    const total = await prisma.user.count({
      where: {
        clubId: 'club-padel-estrella',
        role: 'PLAYER'
      }
    });
    
    console.log(`\n📊 Total clientes en Padel Estrella: ${total}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();
