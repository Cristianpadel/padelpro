// Test the auto-generation system by creating minimal data and testing booking
async function testAutoGenerationSystem() {
  const baseUrl = 'http://localhost:9002';
  
  try {
    console.log('🧪 Testing Auto-Generation System...');
    
    // First, let's get existing users
    console.log('📋 Fetching existing users...');
    const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
    
    if (!usersResponse.ok) {
      throw new Error(`Failed to fetch users: ${usersResponse.status}`);
    }
    
    const users = await usersResponse.json();
    console.log(`✅ Found ${users.length} users in system`);
    
    if (users.length === 0) {
      console.log('❌ No users found. Please run api-seed.js first.');
      return;
    }
    
    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.name} (${testUser.id})`);
    
    // Now I need to create a time slot to test with
    // Since we don't have a direct TimeSlot API, let's create one manually
    console.log('\n🎯 Testing booking endpoint with mock data...');
    
    // Test booking with a fake timeSlotId to see how the API responds
    const testBookingData = {
      userId: testUser.id,
      timeSlotId: 'test-slot-1',
      groupSize: 1
    };
    
    console.log('📝 Testing booking request:', testBookingData);
    
    const bookingResponse = await fetch(`${baseUrl}/api/classes/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBookingData)
    });
    
    const bookingResult = await bookingResponse.json();
    console.log('📊 Booking response status:', bookingResponse.status);
    console.log('📊 Booking response:', bookingResult);
    
    if (bookingResponse.status === 404 && bookingResult.error === 'TimeSlot not found') {
      console.log('\n✅ Booking API is working correctly - needs actual TimeSlot data');
      console.log('🔧 Next step: Create actual club, courts, instructors, and time slots');
    } else if (bookingResponse.ok) {
      console.log('\n🎉 SUCCESS: Booking created successfully!');
      console.log('🔄 Auto-generation should have triggered');
    } else {
      console.log('\n❌ Unexpected response from booking API');
    }
    
  } catch (error) {
    console.error('❌ Error testing system:', error);
  }
}

testAutoGenerationSystem();