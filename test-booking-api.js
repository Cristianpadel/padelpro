async function testCreateBooking() {
  try {
    console.log('🧪 Testing booking creation...');
    
    const response = await fetch('http://localhost:9002/api/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'admin-1',
        timeSlotId: 'slot-today-3',
        groupSize: 2
      }),
    });

    console.log('📊 Response status:', response.status);
    const result = await response.json();
    console.log('📋 Response data:', result);

    if (response.ok) {
      console.log('✅ Booking created successfully!');
      
      // Test getting user bookings
      console.log('\n� Testing get user bookings...');
      const bookingsResponse = await fetch('http://localhost:9002/api/my/bookings?userId=admin-1');
      console.log('📊 Bookings response status:', bookingsResponse.status);
      
      if (bookingsResponse.ok) {
        const bookings = await bookingsResponse.json();
        console.log('📋 User bookings:', JSON.stringify(bookings, null, 2));
        console.log(`✅ Found ${bookings.length} bookings for admin-1`);
      } else {
        const error = await bookingsResponse.json();
        console.log('❌ Error getting bookings:', error);
      }
    } else {
      console.log('❌ Booking creation failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCreateBooking();
