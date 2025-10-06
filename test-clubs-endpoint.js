// test-clubs-endpoint.js
const fetch = require('node-fetch');

async function testClubsEndpoint() {
  try {
    console.log('🔍 Testing clubs endpoint...');
    
    const response = await fetch('http://localhost:9002/api/admin/clubs');
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    if (!response.ok) {
      console.log('❌ Error response');
      const errorText = await response.text();
      console.log('Error details:', errorText);
      return;
    }
    
    const clubs = await response.json();
    console.log('✅ Success! Clubs found:', clubs.length);
    console.log('📋 Clubs data:', JSON.stringify(clubs, null, 2));
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testClubsEndpoint();