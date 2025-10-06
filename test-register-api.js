// test-register-api.js
const https = require('http');

const data = JSON.stringify({
  name: "Test User Registration",
  email: "test.registration@example.com",
  password: "test123",
  genderCategory: "masculino",
  level: "intermedio"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let responseBody = '';
  
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('\n--- Response Body ---');
    try {
      const jsonResponse = JSON.parse(responseBody);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log(responseBody);
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.write(data);
req.end();