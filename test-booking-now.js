const http = require('http');

async function testBooking() {
  try {
    console.log('🎯 Probando reserva de Alex García...');
    
    const postData = JSON.stringify({
      userId: 'user-1',
      timeSlotId: 'class-2025-09-24-09-inst-1',
      groupSize: 1
    });

    const options = {
      hostname: 'localhost',
      port: 9002,
      path: '/api/classes/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('📋 Respuesta:', data);
        const result = JSON.parse(data);
        
        if (res.statusCode === 200) {
          console.log('✅ Reserva exitosa!');
        } else {
          console.log('❌ Error en reserva:', result);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error.message);
    });

    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testBooking();