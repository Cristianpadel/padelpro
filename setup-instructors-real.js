const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function setupInstructors() {
  try {
    console.log('🔍 Verificando instructores de Padel Estrella...\n');
    
    // Verificar instructores existentes
    const existingInstructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      }
    });
    
    console.log(`📊 Instructores existentes: ${existingInstructors.length}`);
    existingInstructors.forEach(inst => {
      console.log(`  - ${inst.user ? inst.user.name : 'SIN USUARIO'} (${inst.id})`);
    });
    
    // Si hay instructores sin usuario, los eliminamos
    if (existingInstructors.some(inst => !inst.user)) {
      console.log('\n🗑️ Eliminando instructores sin usuario...');
      for (const inst of existingInstructors) {
        if (!inst.user) {
          await prisma.instructor.delete({ where: { id: inst.id } });
          console.log(`  ❌ Eliminado: ${inst.id}`);
        }
      }
    }
    
    // Crear instructores nuevos con usuarios
    const instructorData = [
      { name: 'Carlos Martínez', email: 'carlos.martinez@padelstrella.com', specialty: 'Técnica avanzada' },
      { name: 'Lucía García', email: 'lucia.garcia@padelstrella.com', specialty: 'Iniciación' },
      { name: 'Miguel Rodríguez', email: 'miguel.rodriguez@padelstrella.com', specialty: 'Competición' },
      { name: 'Ana López', email: 'ana.lopez@padelstrella.com', specialty: 'Físico y estrategia' },
      { name: 'David Fernández', email: 'david.fernandez@padelstrella.com', specialty: 'Perfeccionamiento' },
      { name: 'Elena Sánchez', email: 'elena.sanchez@padelstrella.com', specialty: 'Tácticas de juego' },
    ];
    
    console.log('\n✨ Creando instructores con usuarios...\n');
    
    for (const data of instructorData) {
      // Verificar si ya existe el usuario
      let user = await prisma.user.findUnique({
        where: { email: data.email }
      });
      
      if (!user) {
        // Crear usuario
        user = await prisma.user.create({
          data: {
            email: data.email,
            name: data.name,
            role: 'INSTRUCTOR',
            clubId: 'club-padel-estrella'
          }
        });
        console.log(`  ✅ Usuario creado: ${user.name}`);
      } else {
        console.log(`  ⚠️ Usuario ya existe: ${user.name}`);
      }
      
      // Verificar si ya existe el instructor
      const existingInstructor = await prisma.instructor.findUnique({
        where: { userId: user.id }
      });
      
      if (!existingInstructor) {
        // Crear instructor
        const instructor = await prisma.instructor.create({
          data: {
            userId: user.id,
            clubId: 'club-padel-estrella',
            specialties: data.specialty,
            hourlyRate: 25.0,
            isActive: true
          }
        });
        console.log(`  ✅ Instructor creado: ${data.name} (${instructor.id})`);
      } else {
        console.log(`  ⚠️ Instructor ya existe: ${data.name}`);
      }
    }
    
    // Mostrar lista final
    console.log('\n📋 Lista final de instructores de Padel Estrella:');
    const finalInstructors = await prisma.instructor.findMany({
      where: {
        clubId: 'club-padel-estrella'
      },
      include: {
        user: true
      }
    });
    
    finalInstructors.forEach((inst, i) => {
      console.log(`${i + 1}. ${inst.user.name} - ${inst.specialties}`);
      console.log(`   Email: ${inst.user.email}`);
    });
    
    console.log(`\n✨ Total: ${finalInstructors.length} instructores activos`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupInstructors();
