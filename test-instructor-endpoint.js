// test-instructor-endpoint.js
const fetch = require('node-fetch');

async function testInstructorEndpoint() {
  try {
    console.log('🔍 Testing instructor creation endpoint...');
    
    const instructorData = {
      userId: 'user-test-instructor-1758832773027',
      clubId: 'club-1',
      specialties: 'Pádel Básico',
      experience: '3-5 años'
    };
    
    console.log('📋 Sending data:', JSON.stringify(instructorData, null, 2));
    
    const response = await fetch('http://localhost:9002/api/admin/instructors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(instructorData)
    });
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    const responseText = await response.text();
    console.log('📋 Response body:', responseText);
    
    if (!response.ok) {
      console.log('❌ Error creating instructor');
    } else {
      console.log('✅ Instructor created successfully');
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testInstructorEndpoint();