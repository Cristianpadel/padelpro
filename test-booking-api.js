async function testBookingAPI() {
  try {
    console.log('🧪 Probando API de reservas...');
    
    // Primero, verificar que tengamos clases disponibles
    const classesResponse = await fetch('http://localhost:9002/api/timeslots?clubId=club-1&date=2025-09-11');
    const classes = await classesResponse.json();
    
    console.log(`📅 Clases disponibles: ${classes.length}`);
    if (classes.length > 0) {
      console.log(`Primera clase: ${classes[0].id}`);
    }
    
    // Intentar hacer una reserva con la segunda clase disponible
    const bookingData = {
      timeSlotId: classes[1]?.id || "class-2025-09-11-12-inst-2",
      userId: "user-alex-test"
    };
    
    console.log('📝 Datos de reserva:', bookingData);
    
    const bookingResponse = await fetch('http://localhost:9002/api/classes/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData)
    });
    
    console.log(`📡 Status de respuesta: ${bookingResponse.status}`);
    
    const result = await bookingResponse.text();
    console.log('📋 Respuesta:', result);
    
    if (bookingResponse.ok) {
      console.log('✅ Reserva exitosa');
    } else {
      console.log('❌ Error en la reserva');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

testBookingAPI();
