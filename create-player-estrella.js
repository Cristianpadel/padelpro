const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPlayerForEstrella() {
  try {
    console.log('👤 Creando usuario jugador para Padel Estrella...');
    
    const player = await prisma.user.create({
      data: {
        email: 'jugador@padelestrella.com',
        name: 'Ana Martínez',
        phone: '+34 666 123 456',
        level: 'intermedio',
        position: 'reves',
        clubId: 'cmftnbe2o0001tgkobtrxipip', // Club Padel Estrella
        role: 'PLAYER',
        preference: 'NORMAL',
        visibility: 'PUBLIC',
        bio: 'Jugadora de pádel nivel intermedio, me gusta jugar por la tarde',
        credits: 100
      }
    });
    
    console.log('✅ Usuario jugador creado exitosamente!');
    console.log(`👤 Nombre: ${player.name}`);
    console.log(`📧 Email: ${player.email}`);
    console.log(`🆔 ID: ${player.id}`);
    console.log(`🏢 Club: ${player.clubId}`);
    console.log(`⭐ Nivel: ${player.level}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPlayerForEstrella();