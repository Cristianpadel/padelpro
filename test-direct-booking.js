async function testDirectBooking() {
  try {
    console.log('🧪 Probando reserva directa en clase de las 16:00...');
    
    const bookingData = {
      timeSlotId: "class-2025-09-11-14-inst-1", // Clase de las 16:00 que está disponible
      userId: "user-alex-test"
    };
    
    console.log('📝 Enviando solicitud:', bookingData);
    
    const response = await fetch('http://localhost:9002/api/classes/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    console.log(`📡 Status: ${response.status}`);
    
    const result = await response.text();
    console.log('📋 Respuesta completa:', result);
    
    if (response.ok) {
      console.log('✅ Reserva exitosa desde terminal');
    } else {
      console.log('❌ Error en la reserva desde terminal');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testDirectBooking();
