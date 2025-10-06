// Test específico para la fecha de hoy
async function testTodayTimeSlots() {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log('📅 Fecha de hoy:', today);
    
    console.log('🔍 Testeando API /api/timeslots para fecha actual...');
    const response = await fetch(`http://localhost:9002/api/timeslots?clubId=club-1&date=${today}`);
    
    if (!response.ok) {
      console.error('❌ Error en response:', response.status, response.statusText);
      return;
    }
    
    const timeSlots = await response.json();
    console.log('✅ TimeSlots encontrados para hoy:', timeSlots.length);
    
    if (timeSlots.length === 0) {
      console.log('⚠️ No hay timeSlots para hoy, probando con 2025-09-14...');
      const response2 = await fetch(`http://localhost:9002/api/timeslots?clubId=club-1&date=2025-09-14`);
      const timeSlots2 = await response2.json();
      console.log('✅ TimeSlots encontrados para 2025-09-14:', timeSlots2.length);
    }
    
    timeSlots.forEach((slot, index) => {
      console.log(`📋 Slot ${index + 1}:`, {
        id: slot.id,
        start: slot.start,
        instructor: slot.instructorName,
        bookedPlayers: slot.bookedPlayers
      });
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTodayTimeSlots();