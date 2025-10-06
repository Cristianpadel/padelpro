// Get existing users
async function getUsers() {
  try {
    const response = await fetch('http://localhost:9002/api/admin/users');
    const users = await response.json();
    
    console.log('🔍 Users found:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.id}) - Level: ${user.level} - Email: ${user.email}`);
    });
    
    return users;
  } catch (error) {
    console.error('Error:', error);
  }
}

getUsers();