// test-get-instructors.js
const fetch = require('node-fetch');

async function testGetInstructors() {
  try {
    console.log('🔍 Testing GET instructors endpoint...');
    
    const response = await fetch('http://localhost:9002/api/admin/instructors');
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const instructors = await response.json();
    console.log('✅ Success! Instructors found:', instructors.length);
    console.log('📋 Instructors data:', JSON.stringify(instructors, null, 2));
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testGetInstructors();