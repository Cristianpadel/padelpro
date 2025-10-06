// check-new-user-data.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkUserData() {
  try {
    console.log('🔍 Verificando datos de usuarios recientes...');
    
    // Obtener todos los usuarios y sus datos
    const users = await prisma.$queryRaw`
      SELECT id, name, email, level, genderCategory, role, createdAt 
      FROM User 
      ORDER BY createdAt DESC
      LIMIT 5
    `;
    
    console.log('\n👥 Usuarios más recientes:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🎯 Level: "${user.level}"`);
      console.log(`   👤 Gender Category: "${user.genderCategory}"`);
      console.log(`   📅 Created: ${user.createdAt}`);
      console.log('');
    });
    
    // Verificar si hay bookings recientes
    console.log('📋 Verificando reservas recientes...');
    const recentBookings = await prisma.$queryRaw`
      SELECT 
        b.id, b.userId, b.timeSlotId, b.groupSize, b.status, b.createdAt,
        u.name as userName, u.level as userLevel, u.genderCategory as userGender
      FROM Booking b
      JOIN User u ON b.userId = u.id
      ORDER BY b.createdAt DESC
      LIMIT 5
    `;
    
    console.log('\n🎫 Reservas más recientes:');
    recentBookings.forEach((booking, index) => {
      console.log(`${index + 1}. ${booking.userName} - ${booking.timeSlotId}`);
      console.log(`   👤 Gender: "${booking.userGender}"`);
      console.log(`   🎯 Level: "${booking.userLevel}"`);
      console.log(`   👥 Group Size: ${booking.groupSize}`);
      console.log(`   ✅ Status: ${booking.status}`);
      console.log(`   📅 Created: ${booking.createdAt}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkUserData();