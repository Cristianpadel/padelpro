// test-bookings-api.js
const http = require('http');

function testBookingsAPI() {
  const options = {
    hostname: 'localhost',
    port: 9002,
    path: '/api/classes/slot-test-1/bookings',
    method: 'GET'
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('\n--- API Response ---');
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log('Number of bookings:', jsonResponse.length);
        
        jsonResponse.forEach((booking, index) => {
          console.log(`\n${index + 1}. Booking ID: ${booking.id || booking.userId}`);
          console.log(`   Name: ${booking.name}`);
          console.log(`   Gender: ${booking.userGender}`);
          console.log(`   Level: ${booking.userLevel}`);
          console.log(`   Created: ${booking.createdAt}`);
          console.log(`   Status: ${booking.status}`);
        });
        
        // Test the dynamic logic
        if (jsonResponse.length > 0) {
          const sortedBookings = [...jsonResponse].sort((a, b) => 
            new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
          );
          
          const firstUser = sortedBookings[0];
          console.log('\n🎯 Dynamic Logic Test:');
          console.log(`First user by creation time: ${firstUser.name}`);
          console.log(`Expected category: ${firstUser.userGender === 'chica' ? 'Chica' : firstUser.userGender === 'masculino' ? 'Chico' : 'Unknown'}`);
          
          const levelMap = {
            'principiante': '1.0 - 2.5',
            'inicial-medio': '2.0 - 3.5', 
            'intermedio': '3.0 - 4.5',
            'avanzado': '4.0 - 5.5'
          };
          console.log(`Expected level: ${levelMap[firstUser.userLevel] || firstUser.userLevel}`);
        }
        
      } catch (e) {
        console.log('Raw response:', responseBody);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Request error: ${e.message}`);
  });

  req.end();
}

testBookingsAPI();