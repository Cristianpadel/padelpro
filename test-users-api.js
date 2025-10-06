const fetch = require('node-fetch');

async function testUsersAPI() {
  try {
    console.log('🧪 Probando API de usuarios...\n');
    
    // Test con clubId
    console.log('1️⃣ API con clubId=club-padel-estrella:');
    const response1 = await fetch('http://localhost:9002/api/admin/users?clubId=club-padel-estrella');
    const data1 = await response1.json();
    
    console.log(`   Status: ${response1.status}`);
    console.log(`   Total usuarios: ${data1.length}\n`);
    
    // Contar por role
    const byRole = {};
    data1.forEach(user => {
      byRole[user.role] = (byRole[user.role] || 0) + 1;
    });
    
    console.log('   Por role:');
    Object.entries(byRole).forEach(([role, count]) => {
      console.log(`      ${role}: ${count}`);
    });
    
    // Mostrar algunos PLAYER
    const players = data1.filter(u => u.role === 'PLAYER');
    console.log(`\n   Primeros 5 clientes:`);
    players.slice(0, 5).forEach((user, i) => {
      console.log(`      ${i + 1}. ${user.name} - ${user.email}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testUsersAPI();
