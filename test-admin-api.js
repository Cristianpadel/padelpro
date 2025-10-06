const http = require('http');

console.log('🧪 Testing Admin Bookings API...');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/admin/bookings',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Content-Type:', res.headers['content-type']);
    
    try {
      const result = JSON.parse(data);
      console.log('✅ JSON parsed successfully!');
      console.log('📊 Bookings found:', result.length);
      
      if (result.length > 0) {
        console.log('\n📋 First booking details:');
        console.log('- ID:', result[0].id);
        console.log('- User:', result[0].user.name);
        console.log('- Group Size:', result[0].groupSize);
        console.log('- Status:', result[0].status);
        console.log('- TimeSlot ID:', result[0].timeSlotId);
        console.log('- Total Players:', result[0].timeSlot.totalPlayers);
      }
      
      // Buscar reservas de Alex Garcia
      const alexBookings = result.filter(booking => 
        booking.user.name && booking.user.name.toLowerCase().includes('alex')
      );
      
      console.log('\n🔍 Alex Garcia bookings:', alexBookings.length);
      alexBookings.forEach((booking, index) => {
        console.log(`  ${index + 1}. Group Size: ${booking.groupSize}, Status: ${booking.status}`);
      });
      
    } catch (e) {
      console.error('❌ JSON Parse Error:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request Error:', e.message);
});

req.end();