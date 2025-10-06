// test-api-connection.js
const http = require('http');

// Test simple GET endpoint first
const options = {
  hostname: 'localhost',
  port: 9002,
  path: '/api/debug/user',
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
    console.log('\n--- Response Body ---');
    try {
      const jsonResponse = JSON.parse(responseBody);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log(responseBody);
    }
    
    // If this works, test the register endpoint
    testRegisterEndpoint();
  });
});

req.on('error', (e) => {
  console.error(`Connection error: ${e.message}`);
  console.log('Make sure the dev server is running on port 9002');
});

req.end();

function testRegisterEndpoint() {
  console.log('\n=== Testing Registration Endpoint ===');
  
  const data = JSON.stringify({
    name: "Test User Registration",
    email: "test.registration@example.com",
    password: "test123",
    genderCategory: "masculino",
    level: "intermedio"
  });

  const options = {
    hostname: 'localhost',
    port: 9002,
    path: '/api/register',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Register Status: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    let responseBody = '';
    
    res.on('data', (chunk) => {
      responseBody += chunk;
    });
    
    res.on('end', () => {
      console.log('\n--- Register Response ---');
      try {
        const jsonResponse = JSON.parse(responseBody);
        console.log(JSON.stringify(jsonResponse, null, 2));
      } catch (e) {
        console.log(responseBody);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`Register request error: ${e.message}`);
  });

  req.write(data);
  req.end();
}