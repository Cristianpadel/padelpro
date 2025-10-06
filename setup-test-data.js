const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔍 Configurando base de datos completa...');
    
    // 1. Crear administrador
    let admin = await prisma.admin.findFirst();
    if (!admin) {
      console.log('👑 Creando administrador...');
      admin = await prisma.admin.create({
        data: {
          email: 'admin@padelclub.com',
          name: 'Administrador Principal',
          role: 'SUPER_ADMIN',
          phone: '+34 600 000 000'
        }
      });
    }

    // 2. Crear clubs
    let club = await prisma.club.findFirst();
    if (!club) {
      console.log('🏢 Creando club...');
      club = await prisma.club.create({
        data: {
          name: 'Club Barcelona',
          address: 'Calle Pádel 123, Barcelona',
          adminId: admin.id,
          phone: '+34 600 111 111',
          email: 'barcelona@padelclub.com'
        }
      });
    }

    // 3. Crear canchas si no existen
    const courts = await prisma.court.findMany();
    console.log(`🏟️ Canchas encontradas: ${courts.length}`);
    
    if (courts.length === 0) {
      console.log('🎾 Creando canchas...');
      await prisma.court.createMany({
        data: [
          { number: 1, name: 'Pista Central', clubId: club.id, isActive: true },
          { number: 2, name: 'Pista Norte', clubId: club.id, isActive: true },
          { number: 3, name: 'Pista Sur', clubId: club.id, isActive: true }
        ]
      });
    }
    
    // 4. Verificar instructores
    const instructors = await prisma.instructor.findMany({
      include: { user: true }
    });
    console.log(`📊 Instructores encontrados: ${instructors.length}`);
    
    if (instructors.length === 0) {
      console.log('👨‍🏫 Creando instructores de prueba...');
      
      // Crear usuarios para instructores
      const timestamp = Date.now();
      const user1 = await prisma.user.create({
        data: {
          name: 'Carlos Instructor',
          email: `carlos${timestamp}@instructor.com`,
          role: 'PLAYER',
          level: 'avanzado',
          credits: 0,
          clubId: club.id
        }
      });
      
      const user2 = await prisma.user.create({
        data: {
          name: 'María Profesora',
          email: `maria${timestamp}@instructor.com`,
          role: 'PLAYER', 
          level: 'avanzado',
          credits: 0,
          clubId: club.id
        }
      });
      
      // Crear instructores
      await prisma.instructor.create({
        data: {
          name: 'Carlos Instructor',
          userId: user1.id,
          clubId: club.id,
          specialties: 'Técnica, Estrategia',
          experience: '5 años',
          isActive: true
        }
      });
      
      await prisma.instructor.create({
        data: {
          name: 'María Profesora', 
          userId: user2.id,
          clubId: club.id,
          specialties: 'Iniciación, Técnica',
          experience: '3 años',
          isActive: true
        }
      });
      
      console.log('✅ Instructores creados');
    }
    
    console.log('� Datos completos preparados para generar clases grupales');
    console.log(`   📋 Club ID: ${club.id}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('❌ Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();