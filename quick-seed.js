const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting quick seed...');

  // Check if super admin exists
  let superAdmin = await prisma.admin.findUnique({
    where: { email: 'superadmin@padelpro.com' }
  });

  if (!superAdmin) {
    superAdmin = await prisma.admin.create({
      data: {
        id: 'super-admin-1',
        name: 'Super Administrador',
        email: 'superadmin@padelpro.com',
        role: 'SUPER_ADMIN'
      }
    });
    console.log('✅ Created super admin');
  } else {
    console.log('ℹ️ Super admin already exists');
  }

  // Check if club admins exist
  let clubAdmin1 = await prisma.admin.findUnique({
    where: { email: 'admin.bcn@padelpro.com' }
  });

  if (!clubAdmin1) {
    clubAdmin1 = await prisma.admin.create({
      data: {
        name: 'Admin Barcelona',
        email: 'admin.bcn@padelpro.com',
        role: 'CLUB_ADMIN'
      }
    });
    console.log('✅ Created Barcelona admin');
  } else {
    console.log('ℹ️ Barcelona admin already exists');
  }

  let clubAdmin2 = await prisma.admin.findUnique({
    where: { email: 'admin.mad@padelpro.com' }
  });

  if (!clubAdmin2) {
    clubAdmin2 = await prisma.admin.create({
      data: {
        name: 'Admin Madrid',
        email: 'admin.mad@padelpro.com',
        role: 'CLUB_ADMIN'
      }
    });
    console.log('✅ Created Madrid admin');
  } else {
    console.log('ℹ️ Madrid admin already exists');
  }

  // Check if clubs exist
  let club1 = await prisma.club.findUnique({
    where: { id: 'club-1' }
  });

  if (!club1) {
    club1 = await prisma.club.create({
      data: {
        id: 'club-1',
        name: 'Club de Pádel Barcelona',
        address: 'Calle Barcelona 123',
        adminId: clubAdmin1.id
      }
    });
    console.log('✅ Created Barcelona club');
  } else {
    console.log('ℹ️ Barcelona club already exists');
  }

  let club2 = await prisma.club.findUnique({
    where: { id: 'club-2' }
  });

  if (!club2) {
    club2 = await prisma.club.create({
      data: {
        id: 'club-2', 
        name: 'Club de Pádel Madrid',
        address: 'Calle Madrid 456',
        adminId: clubAdmin2.id
      }
    });
    console.log('✅ Created Madrid club');
  } else {
    console.log('ℹ️ Madrid club already exists');
  }

  // Check if courts exist
  const courtsCount = await prisma.court.count();
  
  if (courtsCount === 0) {
    await prisma.court.createMany({
      data: [
        {
          clubId: club1.id,
          number: 1,
          name: 'Pista Central',
          isActive: true
        },
        {
          clubId: club1.id, 
          number: 2,
          name: 'Pista Norte',
          isActive: true
        },
        {
          clubId: club2.id,
          number: 1, 
          name: 'Pista Principal',
          isActive: true
        }
      ]
    });
    console.log('✅ Created 3 courts');
  } else {
    console.log(`ℹ️ ${courtsCount} courts already exist`);
  }

  // Check if users exist
  const usersCount = await prisma.user.count();
  
  if (usersCount === 0) {
    await prisma.user.createMany({
      data: [
        {
          name: 'Carlos Instructor',
          email: 'carlos.instructor@padelpro.com',
          clubId: club1.id,
          role: 'PLAYER',
          level: 'avanzado'
        },
        {
          name: 'María Entrenadora',
          email: 'maria.entrenadora@padelpro.com',
          clubId: club2.id,
          role: 'PLAYER',
          level: 'profesional'
        },
        {
          name: 'Juan Cliente',
          email: 'juan.cliente@padelpro.com',
          clubId: club1.id,
          role: 'PLAYER',
          level: 'principiante'
        }
      ]
    });
    console.log('✅ Created 3 users');
  } else {
    console.log(`ℹ️ ${usersCount} users already exist`);
  }

  console.log('✅ Quick seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });