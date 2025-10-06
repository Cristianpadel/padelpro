const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInstructors() {
  try {
    console.log('=== CHECKING INSTRUCTORS IN DATABASE ===');
    
    const instructors = await prisma.instructor.findMany();
    console.log('\nAll instructors in database:');
    instructors.forEach(inst => {
      console.log(`- ID: ${inst.id}, Name: ${inst.name}, UserId: ${inst.userId}, Specialties: ${inst.specialties}`);
    });
    
    // Si los instructores no tienen nombres apropiados, vamos a actualizar
    if (instructors.length > 0) {
      console.log('\n=== UPDATING INSTRUCTOR NAMES ===');
      
      const instructorNames = [
        'Carlos Rodríguez',
        'María Fernández', 
        'Diego Martínez',
        'Ana González'
      ];
      
      for (let i = 0; i < instructors.length; i++) {
        const instructor = instructors[i];
        const newName = instructorNames[i] || `Instructor ${i + 1}`;
        
        try {
          const updated = await prisma.instructor.update({
            where: { id: instructor.id },
            data: { 
              name: newName,
              specialties: instructor.specialties || 'Pádel General'
            }
          });
          console.log(`✅ Updated instructor: ${updated.name}`);
        } catch (error) {
          console.log(`❌ Error updating instructor ${instructor.id}: ${error.message}`);
        }
      }
      
      // Mostrar instructores actualizados
      console.log('\n=== UPDATED INSTRUCTORS ===');
      const updatedInstructors = await prisma.instructor.findMany();
      updatedInstructors.forEach(inst => {
        console.log(`- ID: ${inst.id}, Name: ${inst.name}, Specialties: ${inst.specialties}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

async function checkAdmins() {
  try {
    console.log('\n=== CHECKING ADMINS IN DATABASE ===');
    
    const admins = await prisma.admin.findMany();
    console.log('\nAll admins in database:');
    admins.forEach(admin => {
      console.log(`- ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
    });
    
    // Si no hay admins, crear algunos
    if (admins.length === 0) {
      console.log('\n=== CREATING DEFAULT ADMINS ===');
      
      const defaultAdmins = [
        { email: 'admin@madrid.com', name: 'Juan Pérez', role: 'CLUB_ADMIN' },
        { email: 'admin@barcelona.com', name: 'María González', role: 'CLUB_ADMIN' },
        { email: 'superadmin@padelpro.com', name: 'Cristian Parra', role: 'SUPER_ADMIN' }
      ];
      
      for (const adminData of defaultAdmins) {
        try {
          const newAdmin = await prisma.admin.create({
            data: adminData
          });
          console.log(`✅ Created admin: ${newAdmin.name} (${newAdmin.email})`);
        } catch (error) {
          console.log(`❌ Error creating admin ${adminData.name}: ${error.message}`);
        }
      }
      
      // Mostrar admins creados
      console.log('\n=== CREATED ADMINS ===');
      const updatedAdmins = await prisma.admin.findMany();
      updatedAdmins.forEach(admin => {
        console.log(`- ID: ${admin.id}, Name: ${admin.name}, Email: ${admin.email}, Role: ${admin.role}`);
      });
    }
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkInstructors().then(() => checkAdmins());
