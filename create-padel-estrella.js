const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createPadelEstrella() {
  try {
    // Primero verificar si ya existe
    const existing = await prisma.club.findFirst({
      where: { name: { contains: 'Estrella' } }
    });
    
    if (existing) {
      console.log('✅ Club Padel Estrella ya existe:', existing.id);
      return existing;
    }
    
    // Obtener el primer admin disponible
    const admin = await prisma.admin.findFirst();
    if (!admin) {
      throw new Error('No hay administradores disponibles');
    }
    
    console.log('👤 Usando admin:', admin.name);
    
    // Crear el club
    const club = await prisma.club.create({
      data: {
        name: 'Padel Estrella',
        address: 'Madrid, España',
        phone: '+34 600 123 456',
        email: 'info@padelestrella.com',
        website: 'www.padelestrella.com',
        description: 'Club de pádel Estrella - Madrid',
        adminId: admin.id
      }
    });
    
    console.log('🎯 Club Padel Estrella creado exitosamente!');
    console.log('ID:', club.id);
    console.log('Nombre:', club.name);
    console.log('Dirección:', club.address);
    
    return club;
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createPadelEstrella();