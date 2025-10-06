const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCourtsForPadelEstrella() {
  try {
    // Buscar el club
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' }
    });
    
    if (!club) {
      throw new Error('Club Padel Estrella no encontrado');
    }
    
    console.log('🏢 Club encontrado:', club.name, 'ID:', club.id);
    
    // Crear 3 pistas
    const courts = [];
    for (let i = 1; i <= 3; i++) {
      const court = await prisma.court.create({
        data: {
          number: i,
          name: `Pista ${i}`,
          clubId: club.id,
          isActive: true
        }
      });
      courts.push(court);
      console.log(`🎾 Pista ${i} creada: ID ${court.id}`);
    }
    
    console.log(`✅ ${courts.length} pistas creadas para ${club.name}`);
    return { club, courts };
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createCourtsForPadelEstrella();