const fetch = require('node-fetch');

async function testBookingAPI() {
  try {
    console.log('🔍 Probando API de reservas...');
    
    // Usar un usuario que sabemos que existe y una clase que sabemos que existe
    const testData = {
      userId: 'cmftpzw3g0001tguwgauzlxkz', // Ana Martínez (usuario de Padel Estrella)
      timeSlotId: 'cmftox8z80000tgw8bb4q4e5m', // Primera clase que creamos para Padel Estrella
      groupSize: 1
    };
    
    console.log('📝 Datos de prueba:', testData);
    
    const response = await fetch('http://localhost:9002/api/classes/book', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });
    
    const responseText = await response.text();
    console.log('📊 Status:', response.status);
    console.log('📋 Response:', responseText);
    
    if (response.ok) {
      try {
        const data = JSON.parse(responseText);
        console.log('✅ Reserva exitosa!');
        console.log('🎫 Booking ID:', data.bookingId);
      } catch (e) {
        console.log('✅ Reserva exitosa (texto):', responseText);
      }
    } else {
      console.log('❌ Error en la reserva');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBookingAPI();