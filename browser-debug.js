// Ejecutar en la consola del navegador para debugging
console.log('🔧 Test directo desde navegador');

// Test 1: Verificar si fetch funciona
fetch('/api/classes/slot-2025-09-14-court-1-09:00/bookings')
  .then(response => response.json())
  .then(data => {
    console.log('📋 API Response:', data);
    console.log('📊 Número de bookings:', data.length);
    if (data.length > 0) {
      console.log('✅ Los datos están llegando correctamente');
      console.log('🔍 Primer booking:', data[0]);
    } else {
      console.log('⚠️ El API devuelve array vacío');
    }
  })
  .catch(error => {
    console.error('❌ Error en fetch:', error);
  });

// Test 2: Verificar timeSlots
fetch('/api/timeslots?clubId=club-1&date=2025-09-14')
  .then(response => response.json())
  .then(data => {
    console.log('🎯 TimeSlots para hoy:', data.length);
    data.forEach((slot, index) => {
      if (index < 3) { // Mostrar solo los primeros 3
        console.log(`📅 Slot ${index + 1}:`, slot.id, '- Bookings:', slot.bookedPlayers);
      }
    });
  })
  .catch(error => {
    console.error('❌ Error obteniendo timeSlots:', error);
  });