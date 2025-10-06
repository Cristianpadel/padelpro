// Test booking con user-1
const http = require('http');

async function testBooking() {
    try {
        console.log('🧪 Probando booking con user-1...');
        
        const postData = JSON.stringify({
            userId: 'user-1',
            timeSlotId: 'slot-2025-09-14-court-1-09:00',
            groupSize: 4
        });

        const options = {
            hostname: 'localhost',
            port: 9002,
            path: '/api/classes/book',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            console.log('📊 Status:', res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    console.log('📊 Response:', jsonData);
                    
                    if (res.statusCode === 200) {
                        console.log('✅ Booking exitoso!');
                    } else {
                        console.log('❌ Error en booking:', jsonData.error);
                    }
                } catch (e) {
                    console.log('📊 Raw response:', data);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error de conexión:', error.message);
        });

        req.write(postData);
        req.end();

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testBooking();