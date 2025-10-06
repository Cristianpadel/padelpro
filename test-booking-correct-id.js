const http = require('http');

async function testBookingWithCorrectId() {
  try {
    console.log('🎯 Probando reserva con ID correcto de Alex García...');
    
    const postData = JSON.stringify({
      userId: 'cmfxhfr2u000gtg5gpwk13xnj', // ID correcto de Alex García
      timeSlotId: 'cmfxhfr1t0006tg5g27smnm1d', // Un timeSlot existente
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
        console.log('📋 Status Code:', res.statusCode);
        console.log('📋 Respuesta:', data);
        
        try {
          const result = JSON.parse(data);
          if (res.statusCode === 200) {
            console.log('✅ Reserva exitosa!');
          } else {
            console.log('❌ Error en reserva:', result);
          }
        } catch (e) {
          console.log('📋 Respuesta cruda:', data);
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

testBookingWithCorrectId();