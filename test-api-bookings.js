// Test API de bookings para una clase específica
async function testBookingsAPI() {
  try {
    console.log('🧪 Testing bookings API...');
    
    // Test para la clase con reserva de 3 jugadores
    const timeSlotId = 'cmfwmpa400007tgf4w3kqigrr';
    console.log(`📞 Calling API for timeSlot: ${timeSlotId}`);
    
    const response = await fetch(`http://localhost:9002/api/classes/${timeSlotId}/bookings`);
    
    console.log('📊 Response status:', response.status);
    
    if (response.ok) {
      const bookings = await response.json();
      console.log('✅ API Response received');
      console.log('📋 Number of bookings:', bookings.length);
      
      bookings.forEach((booking, index) => {
        console.log(`\n${index + 1}. Booking from API:`);
        console.log(`   - userId: ${booking.userId}`);
        console.log(`   - groupSize: ${booking.groupSize} (type: ${typeof booking.groupSize})`);
        console.log(`   - name: ${booking.name}`);
        console.log(`   - status: ${booking.status}`);
      });
      
      // Verificar si nuestro usuario está en la respuesta
      const alexBooking = bookings.find(b => b.userId === 'cmfwmut4v0001tgs0en3il18d');
      if (alexBooking) {
        console.log('\n✅ Alex García found in API response:');
        console.log(`   - GroupSize: ${alexBooking.groupSize}`);
        console.log(`   - Name: ${alexBooking.name}`);
      } else {
        console.log('\n❌ Alex García NOT found in API response');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error calling API:', error);
  }
}

testBookingsAPI();