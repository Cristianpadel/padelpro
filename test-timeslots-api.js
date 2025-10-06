// Test de los timeslots que está devolviendo la API
async function testTimeSlotsAPI() {
  try {
    console.log('🔍 Testeando API /api/timeslots...');
    const response = await fetch('http://localhost:9002/api/timeslots?clubId=club-1&date=2025-09-14');
    
    if (!response.ok) {
      console.error('❌ Error en response:', response.status, response.statusText);
      return;
    }
    
    const timeSlots = await response.json();
    console.log('✅ TimeSlots encontrados:', timeSlots.length);
    
    timeSlots.forEach((slot, index) => {
      console.log(`📋 Slot ${index + 1}:`, {
        id: slot.id,
        start: slot.start,
        end: slot.end,
        instructor: slot.instructorName,
        bookedPlayers: slot.bookedPlayers
      });
    });
    
    // Test del primer slot que tenga reservas
    const slotWithBookings = timeSlots.find(slot => slot.bookedPlayers > 0);
    if (slotWithBookings) {
      console.log('🎯 Testeando bookings para:', slotWithBookings.id);
      const bookingsResponse = await fetch(`http://localhost:9002/api/classes/${slotWithBookings.id}/bookings`);
      const bookings = await bookingsResponse.json();
      console.log('📋 Bookings obtenidos:', bookings);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testTimeSlotsAPI();