const fetch = require('node-fetch');

async function testGeneration() {
  try {
    console.log('🚀 Probando generación de clases con instructores reales...\n');
    
    const response = await fetch('http://localhost:9002/api/admin/generate-class-proposals?clubId=club-padel-estrella&days=1');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    
    if (data.error) {
      console.error('❌ Error:', data.error);
      console.error('Details:', data.details);
    } else {
      console.log('✅ Respuesta exitosa!');
      console.log(`\n📊 Total slots creados: ${data.totalSlots}`);
      
      if (data.slots && data.slots.length > 0) {
        console.log('\n📋 Primeros 5 slots:');
        data.slots.slice(0, 5).forEach((slot, i) => {
          console.log(`${i + 1}. ${slot.date} ${slot.start}-${slot.end}`);
        });
      }
    }
    
    // Verificar instructores en las clases creadas
    console.log('\n🔍 Verificando instructores en las clases...');
    const timeslotsResponse = await fetch('http://localhost:9002/api/timeslots?clubId=club-padel-estrella&date=2025-10-03');
    const timeslots = await timeslotsResponse.json();
    
    if (timeslots.length > 0) {
      console.log(`\n✅ ${timeslots.length} clases encontradas para hoy`);
      console.log('\n👨‍🏫 Instructores en las primeras 5 clases:');
      timeslots.slice(0, 5).forEach((slot, i) => {
        console.log(`${i + 1}. ${slot.instructorName} - ${new Date(slot.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`);
      });
      
      // Contar clases por instructor
      const instructorCounts = {};
      timeslots.forEach(slot => {
        instructorCounts[slot.instructorName] = (instructorCounts[slot.instructorName] || 0) + 1;
      });
      
      console.log('\n📊 Distribución de clases por instructor:');
      Object.entries(instructorCounts).forEach(([name, count]) => {
        console.log(`  ${name}: ${count} clases`);
      });
    }
    
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testGeneration();
