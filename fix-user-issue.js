const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixUserIssue() {
  try {
    console.log('=== FIXING USER ISSUE ===');
    
    // 1. Verificar usuarios existentes
    const users = await prisma.user.findMany();
    console.log('Current users:', users.map(u => ({ id: u.id, name: u.name, email: u.email })));
    
    // 2. Verificar si 'user-alex-test' existe
    const testUser = await prisma.user.findUnique({
      where: { id: 'user-alex-test' }
    });
    
    if (testUser) {
      console.log('✅ Test user exists:', testUser.name);
    } else {
      console.log('❌ Test user does not exist, creating...');
      
      // Crear el usuario de prueba
      const newUser = await prisma.user.create({
        data: {
          id: 'user-alex-test',
          email: 'alex.test@padel.com',
          name: 'Alex Test User',
          clubId: 'club-1',
          role: 'PLAYER',
          level: 'principiante',
          preference: 'NORMAL',
          visibility: 'PUBLIC',
          credits: 0
        }
      });
      console.log('✅ Created test user:', newUser.name);
    }
    
    // 3. Verificar bookings existentes
    const bookings = await prisma.booking.findMany({
      include: {
        user: true,
        timeSlot: true
      }
    });
    
    console.log('Current bookings:', bookings.length);
    
    // 4. Verificar timeslots
    const timeSlots = await prisma.timeSlot.findMany({
      where: {
        clubId: 'club-1'
      }
    });
    
    console.log('Current timeslots:', timeSlots.length);
    
    console.log('=== FIX COMPLETE ===');
    
  } catch (error) {
    console.error('Error fixing user issue:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserIssue();
