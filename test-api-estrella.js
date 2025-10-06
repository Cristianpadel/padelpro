const fetch = require('node-fetch');

async function testAPI() {
  try {
    const response = await fetch('http://localhost:9002/api/timeslots?clubId=cmftnbe2o0001tgkobtrxipip&date=2025-09-21');
    const data = await response.json();
    
    console.log('🔍 API Response:');
    console.log('Status:', response.status);
    console.log('Classes encontradas:', data.length);
    
    if (data.length > 0) {
      console.log('✅ Primera clase:');
      const first = data[0];
      console.log('  ID:', first.id);
      console.log('  Fecha inicio:', first.start);
      console.log('  Nivel:', first.level);
      console.log('  Instructor:', first.instructorName);
    } else {
      console.log('❌ No se encontraron clases');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();