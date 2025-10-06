// Test login for Alex García
const credentials = {
  email: 'alex.garcia@email.com',
  password: 'password123'
};

console.log('Testing login with:');
console.log('Email:', credentials.email);
console.log('Password:', credentials.password);

fetch('http://localhost:9002/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(credentials),
})
  .then(res => res.json())
  .then(data => {
    console.log('\n✅ Login response:', JSON.stringify(data, null, 2));
  })
  .catch(error => {
    console.error('\n❌ Login error:', error);
  });
