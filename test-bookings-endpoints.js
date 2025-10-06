// Test endpoints de bookings
const http = require('http');

async function testBookingsEndpoint(timeSlotId) {
    return new Promise((resolve, reject) => {
        console.log(`🧪 Probando endpoint para ${timeSlotId}...`);
        
        const options = {
            hostname: 'localhost',
            port: 9002,
            path: `/api/classes/${timeSlotId}/bookings`,
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            console.log(`📊 Status para ${timeSlotId}:`, res.statusCode);
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    if (res.statusCode === 200) {
                        const jsonData = JSON.parse(data);
                        console.log(`✅ ${timeSlotId}: ${jsonData.length} bookings`);
                        resolve(jsonData);
                    } else {
                        console.log(`❌ ${timeSlotId}: Error ${res.statusCode}`);
                        console.log(`📊 Raw response:`, data);
                        resolve(null);
                    }
                } catch (e) {
                    console.log(`❌ ${timeSlotId}: Parse error`);
                    console.log(`📊 Raw response:`, data);
                    resolve(null);
                }
            });
        });

        req.on('error', (error) => {
            console.error(`❌ Error de conexión para ${timeSlotId}:`, error.message);
            resolve(null);
        });

        req.end();
    });
}

async function testAll() {
    const timeSlots = [
        'slot-2025-09-14-court-1-11:00',
        'slot-2025-09-14-court-1-09:00',
        'slot-2025-09-14-court-1-16:00'
    ];

    for (const slot of timeSlots) {
        await testBookingsEndpoint(slot);
        await new Promise(resolve => setTimeout(resolve, 100)); // pequeña pausa
    }
}

testAll();