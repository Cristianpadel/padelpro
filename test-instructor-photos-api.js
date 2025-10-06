const fetch = require('node-fetch');

async function testInstructorPhotos() {
  try {
    console.log('🧪 Verificando fotos de instructores en la API...\n');
    
    // Test 1: API de instructores del panel admin
    console.log('1️⃣ API Admin - Instructores de Padel Estrella:');
    const adminResponse = await fetch('http://localhost:9002/api/admin/instructors?clubId=club-padel-estrella');
    const adminData = await adminResponse.json();
    
    console.log(`   Total instructores: ${adminData.length}\n`);
    adminData.forEach((inst, i) => {
      console.log(`   ${i + 1}. ${inst.name}`);
      console.log(`      Foto: ${inst.profilePictureUrl || '❌ SIN FOTO'}`);
    });
    
    // Test 2: API de timeslots (clases)
    console.log('\n\n2️⃣ API TimeSlots - Clases del 03/10/2025:');
    const timeslotsResponse = await fetch('http://localhost:9002/api/timeslots?clubId=club-padel-estrella&date=2025-10-03');
    const timeslotsData = await timeslotsResponse.json();
    
    console.log(`   Total clases: ${timeslotsData.length}\n`);
    
    // Agrupar por instructor
    const byInstructor = {};
    timeslotsData.forEach(slot => {
      if (!byInstructor[slot.instructorName]) {
        byInstructor[slot.instructorName] = {
          count: 0,
          photo: slot.instructorProfilePicture
        };
      }
      byInstructor[slot.instructorName].count++;
    });
    
    Object.entries(byInstructor).forEach(([name, data]) => {
      console.log(`   ${name}:`);
      console.log(`      Clases: ${data.count}`);
      console.log(`      Foto: ${data.photo || '❌ SIN FOTO'}`);
    });
    
    console.log('\n\n✅ Verificación completada!');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testInstructorPhotos();
