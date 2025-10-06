const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createInstructorForPadelEstrella() {
  try {
    // Buscar el club
    const club = await prisma.club.findFirst({
      where: { name: 'Padel Estrella' }
    });
    
    if (!club) {
      throw new Error('Club Padel Estrella no encontrado');
    }
    
    // Crear un usuario instructor genérico
    const user = await prisma.user.create({
      data: {
        email: 'instructor@padelestrella.com',
        name: 'Instructor Genérico',
        level: 'avanzado',
        role: 'INSTRUCTOR',
        clubId: club.id,
        credits: 0
      }
    });
    
    console.log('👤 Usuario instructor creado:', user.name);
    
    // Crear el instructor
    const instructor = await prisma.instructor.create({
      data: {
        userId: user.id,
        name: 'Instructor Genérico',
        specialties: 'Clases grupales',
        experience: 'Instructor certificado',
        hourlyRate: 30.0,
        clubId: club.id,
        isActive: true
      }
    });
    
    console.log('🎾 Instructor creado:', instructor.name, 'ID:', instructor.id);
    return instructor;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createInstructorForPadelEstrella();