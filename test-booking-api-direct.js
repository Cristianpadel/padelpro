// Test directo de la API de booking
async function testBookingAPI() {
  try {
    console.log('🔍 Testeando API de booking...');
    
    const bookingData = {
      userId: 'user-5',
      timeSlotId: 'slot-2025-09-14-court-1-09:00',
      groupSize: 2
    };
    
    console.log('📝 Datos de booking:', bookingData);
    
    const response = await fetch('http://localhost:9002/api/classes/book', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Booking exitoso:', data);
    } else {
      const error = await response.json();
      console.error('❌ Error en booking:', error);
    }
    
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

testBookingAPI();