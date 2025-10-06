// Test completo del sistema de reservas
async function testBookingSystem() {
  const baseUrl = 'http://localhost:3000';
  
  console.log('🧪 === TEST SISTEMA DE RESERVAS ===');
  
  // 1. Obtener clases disponibles
  console.log('\n1. Obteniendo clases disponibles...');
  const timeSlotsResponse = await fetch(`${baseUrl}/api/timeslots?clubId=club-1&date=2025-09-18`);
  const timeSlots = await timeSlotsResponse.json();
  console.log(`✅ Clases encontradas: ${timeSlots.length}`);
  console.log('Primera clase:', timeSlots[0]);
  
  // 2. Ver reservas actuales
  console.log('\n2. Viendo reservas actuales...');
  const bookingsResponse = await fetch(`${baseUrl}/api/classes/${timeSlots[0].id}/bookings`);
  const bookings = await bookingsResponse.json();
  console.log(`✅ Reservas actuales: ${bookings.length}`);
  bookings.forEach(booking => {
    console.log(`  - ${booking.userName} (${booking.userLevel})`);
  });
  
  // 3. Probar nueva reserva
  console.log('\n3. Creando nueva reserva...');
  const newBookingResponse = await fetch(`${baseUrl}/api/classes/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: 'cmfm2r0ou0003tg2cyyyoxil5', // Carlos López
      timeSlotId: timeSlots[0].id,
      groupSize: 1
    })
  });
  
  if (newBookingResponse.ok) {
    console.log('✅ Nueva reserva creada exitosamente');
  } else {
    const error = await newBookingResponse.json();
    console.log('❌ Error creando reserva:', error);
  }
  
  // 4. Ver reservas personales
  console.log('\n4. Viendo mis reservas...');
  const myBookingsResponse = await fetch(`${baseUrl}/api/my/bookings?userId=cmfm2r0ou0003tg2cyyyoxil5`);
  const myBookings = await myBookingsResponse.json();
  console.log(`✅ Mis reservas: ${myBookings.length}`);
  myBookings.forEach(booking => {
    console.log(`  - ${booking.timeSlotInfo.date} ${booking.timeSlotInfo.time} - ${booking.timeSlotInfo.courtName}`);
  });
  
  console.log('\n🎉 === TEST COMPLETADO ===');
}

// Ejecutar test
testBookingSystem().catch(console.error);