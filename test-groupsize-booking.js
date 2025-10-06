// Test de reserva con groupSize = 4
async function testBookingWithGroupSize4() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 === TEST RESERVA CON GROUPSIZE = 4 ===');
  
  try {
    // 1. Hacer una reserva con groupSize = 4
    console.log('\n1. Creando reserva con groupSize = 4...');
    const bookingResponse = await fetch(`${baseUrl}/api/classes/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'cmfm2r0ou0003tg2cyyyoxil5', // Carlos López
        timeSlotId: 'open-slot-1',
        groupSize: 4
      })
    });
    
    const bookingResult = await bookingResponse.json();
    console.log('📝 Resultado de reserva:', bookingResult);
    
    if (bookingResponse.ok) {
      console.log('✅ Reserva creada exitosamente');
      
      // 2. Verificar que aparece correctamente en las reservas
      console.log('\n2. Verificando reservas...');
      const bookingsResponse = await fetch(`${baseUrl}/api/classes/open-slot-1/bookings`);
      const bookings = await bookingsResponse.json();
      
      console.log('📋 Reservas encontradas:', bookings.length);
      bookings.forEach(booking => {
        console.log(`  - ${booking.name} (groupSize: ${booking.groupSize})`);
      });
      
      // Buscar nuestra reserva
      const myBooking = bookings.find(b => b.userId === 'cmfm2r0ou0003tg2cyyyoxil5' && b.groupSize === 4);
      if (myBooking) {
        console.log('✅ Reserva de 4 personas encontrada:', myBooking.name);
      } else {
        console.log('❌ No se encontró la reserva de 4 personas');
      }
      
    } else {
      console.log('❌ Error en la reserva:', bookingResult);
    }
    
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
  
  console.log('\n🎉 === TEST COMPLETADO ===');
}

// Ejecutar test
testBookingWithGroupSize4();