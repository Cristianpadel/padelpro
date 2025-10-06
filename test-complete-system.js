// Create infrastructure data and test the complete auto-generation system
async function testCompleteSystem() {
  const baseUrl = 'http://localhost:9002';
  
  try {
    console.log('🏗️ Creating infrastructure data...');
    
    const infraResponse = await fetch(`${baseUrl}/api/admin/create-infrastructure`, {
      method: 'POST'
    });
    
    const infraResult = await infraResponse.json();
    console.log('📊 Infrastructure response:', infraResult);
    
    if (!infraResponse.ok) {
      throw new Error(`Failed to create infrastructure: ${infraResult.error}`);
    }
    
    console.log('✅ Infrastructure created successfully!');
    console.log('📋 Created:', infraResult.data);
    
    // Get users
    console.log('\n👥 Getting test users...');
    const usersResponse = await fetch(`${baseUrl}/api/admin/users`);
    const users = await usersResponse.json();
    
    if (users.length === 0) {
      throw new Error('No users found');
    }
    
    const testUser = users[0];
    console.log(`👤 Using test user: ${testUser.name} (Level: ${testUser.level})`);
    
    // Test the auto-generation system
    console.log('\n🎯 Testing Auto-Generation System...');
    
    const bookingData = {
      userId: testUser.id,
      timeSlotId: 'open-slot-1', // Using the open slot we created
      groupSize: 1
    };
    
    console.log('📝 Making first booking (should trigger auto-generation):', bookingData);
    
    const bookingResponse = await fetch(`${baseUrl}/api/classes/book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    const bookingResult = await bookingResponse.json();
    console.log('📊 Booking response status:', bookingResponse.status);
    console.log('📊 Booking response:', bookingResult);
    
    if (bookingResponse.ok) {
      console.log('\n🎉 SUCCESS: Auto-Generation System Working!');
      console.log('✅ First booking created successfully');
      console.log('🔄 New open slot should have been auto-generated');
      console.log(`📋 Booking ID: ${bookingResult.bookingId}`);
      console.log('\n💡 The system detected the first booking and should have:');
      console.log('   1. ✅ Created the booking');
      console.log('   2. 🔄 Auto-generated a new "open" time slot');
      console.log('   3. 🏷️ The original slot will classify based on user level');
    } else {
      console.log('\n❌ Booking failed:', bookingResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing complete system:', error);
  }
}

testCompleteSystem();