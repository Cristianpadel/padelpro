// test-get-users.js
const fetch = require('node-fetch');

async function testGetUsers() {
  try {
    console.log('🔍 Testing GET users endpoint...');
    
    const response = await fetch('http://localhost:9002/api/admin/users');
    
    console.log('📋 Response status:', response.status);
    console.log('📋 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ Error response:', errorText);
      return;
    }
    
    const users = await response.json();
    console.log('✅ Success! Users found:', users.length);
    
    // Show first few users
    console.log('📋 Sample users:');
    users.slice(0, 3).forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

testGetUsers();