// Create basic data using API calls instead of direct Prisma
async function createBasicDataViaAPI() {
  const baseUrl = 'http://localhost:9002';
  
  try {
    console.log('🌱 Creating basic data via API...');
    
    // Create users first
    console.log('👥 Creating test users...');
    const users = [
      { name: 'María García', email: 'maria@test.com', level: 'inicial-medio', role: 'PLAYER' },
      { name: 'Juan Pérez', email: 'juan@test.com', level: 'avanzado', role: 'PLAYER' },
      { name: 'Ana Martín', email: 'ana@test.com', level: 'principiante', role: 'PLAYER' },
      { name: 'Carlos López', email: 'carlos@test.com', level: 'intermedio', role: 'PLAYER' }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const response = await fetch(`${baseUrl}/api/admin/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const user = await response.json();
        createdUsers.push(user);
        console.log(`✅ User created: ${user.name}`);
      } else {
        const error = await response.text();
        console.error(`❌ Failed to create user ${userData.name}:`, error);
      }
    }

    console.log(`\n🎉 Created ${createdUsers.length} users successfully!`);
    return { users: createdUsers };
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

createBasicDataViaAPI();