// add-padel-estrella.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addPadelEstrella() {
  try {
    console.log('⭐ Adding Padel Estrella club...');
    
    // Verificar si ya existe
    const existingClub = await prisma.club.findFirst({
      where: {
        name: 'Padel Estrella'
      }
    });
    
    if (existingClub) {
      console.log('✅ Padel Estrella already exists:', existingClub.name);
      return;
    }
    
    // Crear Padel Estrella
    const padelEstrella = await prisma.club.create({
      data: {
        id: 'club-padel-estrella',
        name: 'Padel Estrella',
        address: 'Avenida de las Estrellas 456',
        phone: '+34 987 654 321',
        email: 'info@padelestrella.com',
        pricePerHour: 40.0,
        description: 'Club de pádel premium con instalaciones de primera'
      }
    });
    
    console.log('✅ Padel Estrella created:', padelEstrella.name);
    
    // Crear una pista para Padel Estrella
    const court = await prisma.court.create({
      data: {
        id: 'court-estrella-1',
        clubId: padelEstrella.id,
        name: 'Pista Estrella 1',
        number: 1,
        isActive: true
      }
    });
    
    console.log('✅ Court created for Padel Estrella:', court.name);
    
    // Crear un instructor para Padel Estrella
    const instructorUser = await prisma.user.create({
      data: {
        id: 'user-instructor-estrella',
        email: 'instructor@padelestrella.com',
        name: 'Elena Martínez',
        clubId: padelEstrella.id,
        level: 'profesional',
        role: 'INSTRUCTOR'
      }
    });
    
    const instructor = await prisma.instructor.create({
      data: {
        id: 'instructor-estrella-1',
        userId: instructorUser.id,
        clubId: padelEstrella.id,
        hourlyRate: 35.0,
        bio: 'Instructora profesional con 10 años de experiencia',
        yearsExperience: 10
      }
    });
    
    console.log('✅ Instructor created for Padel Estrella:', instructorUser.name);
    
    // Crear algunas clases para Padel Estrella
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    const timeSlots = [];
    const times = [
      { start: '09:00', end: '10:30' },
      { start: '11:00', end: '12:30' },
      { start: '17:00', end: '18:30' },
      { start: '19:00', end: '20:30' }
    ];
    
    for (const time of times) {
      const startTime = new Date(`${tomorrow.toISOString().split('T')[0]}T${time.start}`);
      const endTime = new Date(`${tomorrow.toISOString().split('T')[0]}T${time.end}`);
      
      const slot = await prisma.timeSlot.create({
        data: {
          clubId: padelEstrella.id,
          courtId: court.id,
          instructorId: instructor.id,
          start: startTime,
          end: endTime,
          maxPlayers: 4,
          totalPrice: 45,
          level: 'intermedio',
          category: 'clase_grupal'
        }
      });
      
      timeSlots.push(slot);
    }
    
    console.log(`✅ Created ${timeSlots.length} time slots for Padel Estrella`);
    
    // Mostrar resumen
    const allClubs = await prisma.club.findMany();
    console.log('\n🏢 All clubs now in database:');
    allClubs.forEach((club, index) => {
      console.log(`${index + 1}. ${club.name} (${club.id})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addPadelEstrella();