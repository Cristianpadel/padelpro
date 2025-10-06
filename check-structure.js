const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkTableStructure() {
  try {
    console.log('🔍 Checking table structures...');
    
    // Verificar estructura de Court
    const courtInfo = await prisma.$queryRaw`PRAGMA table_info(Court)`;
    console.log('\n🏟️ Court table structure:');
    courtInfo.forEach(col => {
      console.log(`   - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    // Verificar estructura de User
    const userInfo = await prisma.$queryRaw`PRAGMA table_info(User)`;
    console.log('\n👤 User table structure:');
    userInfo.forEach(col => {
      console.log(`   - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
    // Verificar estructura de Booking
    const bookingInfo = await prisma.$queryRaw`PRAGMA table_info(Booking)`;
    console.log('\n📝 Booking table structure:');
    bookingInfo.forEach(col => {
      console.log(`   - ${col.name}: ${col.type} ${col.notnull ? '(NOT NULL)' : '(NULLABLE)'}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkTableStructure();