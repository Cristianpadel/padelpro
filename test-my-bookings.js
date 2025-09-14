// Test my bookings endpoint
const http = require('http');

function testMyBookings(userId) {
    return new Promise((resolve, reject) => {
        console.log(`🧪 Probando /api/my/bookings con userId: ${userId}...`);
        
        const options = {
            hostname: 'localhost',
            port: 9002,
            path: `/api/my/bookings?userId=${userId}`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📊 Status:`, res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ ${userId}: ${jsonData.length} bookings encontradas`);
                        if (jsonData.length > 0) {
                            console.log(`📋 Primera reserva:`, {
                                id: jsonData[0].id,
                                timeSlotId: jsonData[0].timeSlotId,
                                groupSize: jsonData[0].groupSize,
                                status: jsonData[0].status
                            });
                        }
                        resolve(jsonData);
                    } else {
                        console.log(`❌ ${userId}: Error ${res.statusCode}`);
                        console.log(`📊 Response:`, data);
                        resolve(null);
                    }
                } catch (e) {
                    console.log(`❌ ${userId}: Parse error`);
                    console.log(`📊 Raw response:`, data);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Error de conexión para ${userId}:`, error.message);
            resolve(null);
        });

        req.end();
    });
}

async function testAll() {
    await testMyBookings('user-1');
    await testMyBookings('user-current'); // Para comparar
}

testAll();