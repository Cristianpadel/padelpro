// create-test-user-masculine.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    console.log('🔧 Creando usuario de prueba masculino avanzado...');
    
    const userId = `user-test-masculine-${Date.now()}`;
    
    // Crear usuario con genderCategory "masculino" y level "avanzado"
    await prisma.$executeRaw`
      INSERT INTO User (
        id, name, email, role, level, genderCategory, 
        profilePictureUrl, credit, blockedCredit, loyaltyPoints, 
        blockedLoyaltyPoints, pendingBonusPoints, 
        createdAt, updatedAt, phone, position, clubId, 
        preference, visibility, bio, preferredGameType
      ) VALUES (
        ${userId}, 'Juan Test Masculino', 'juan.test@example.com', 'PLAYER', 'avanzado', 'masculino',
        NULL, 0, 0.0, 0, 
        0, 0, 
        datetime('now'), datetime('now'), NULL, NULL, NULL,
        'NORMAL', 'PUBLIC', NULL, NULL
      )
    `;
    
    console.log('✅ Usuario creado:', userId);
    
    // Verificar el usuario creado
    const user = await prisma.$queryRaw`
      SELECT id, name, email, level, genderCategory, role, createdAt
      FROM User WHERE id = ${userId}
    `;
    
    console.log('📋 Usuario verificado:');
    console.log(JSON.stringify(user[0], null, 2));
    
    return userId;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();