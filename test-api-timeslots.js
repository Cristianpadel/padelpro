const fetch = require('node-fetch');

async function testApi() {
  try {
    const response = await fetch('http://localhost:9002/api/timeslots?clubId=club-padel-estrella&date=2025-10-03');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Slots found:', data.length || 0);
    
    if (data.length > 0) {
      console.log('\nFirst 3 slots:');
      data.slice(0, 3).forEach((slot, i) => {
        console.log(`\nSlot ${i + 1}:`);
        console.log('  ID:', slot.id);
        console.log('  Start:', slot.start);
        console.log('  End:', slot.end);
        console.log('  Instructor:', slot.instructorName);
      });
    } else if (data.error) {
      console.error('Error:', data.error);
      console.error('Details:', data.details);
    }
  } catch (error) {
    console.error('Request failed:', error.message);
  }
}

testApi();
