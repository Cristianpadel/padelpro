const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log('🔍 Verificando usuarios...');
    
    const users = await prisma.$queryRaw`SELECT id, name FROM User`;
    console.log('👤 Usuarios disponibles:', users);
    
    const timeslots = await prisma.$queryRaw`SELECT id, start, level FROM TimeSlot WHERE DATE(start) = '2025-09-24' LIMIT 3`;
    console.log('⏰ TimeSlots de hoy:', timeslots);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();