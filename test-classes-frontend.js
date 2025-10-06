// Script para diagnosticar el problema de clases no visibles
async function testClassesApi() {
  console.log('🔍 Testing Classes API directly...\n');
  
  const clubId = 'club-1';
  const today = new Date().toISOString().split('T')[0]; // 2025-09-24
  
  console.log('📅 Testing for date:', today);
  console.log('🏢 Testing for clubId:', clubId);
  
  try {
    // Simular la llamada exacta que hace ClassesDisplay
    const url = `http://localhost:9002/api/timeslots?clubId=${clubId}&date=${today}`;
    console.log('🌐 Calling URL:', url);
    
    const response = await fetch(url);
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('📥 Data received:', data.length, 'slots');
    
    if (data.length === 0) {
      console.log('❌ NO SLOTS RETURNED');
      console.log('❓ Possible reasons:');
      console.log('   1. Wrong clubId filter');
      console.log('   2. Wrong date filter');
      console.log('   3. API processing error');
      return;
    }
    
    console.log('✅ SUCCESS! Slots found:');
    data.forEach((slot, index) => {
      console.log(`   ${index + 1}. ID: ${slot.id.substring(0, 12)}... | Time: ${slot.start} | Max: ${slot.maxPlayers} | Price: €${slot.totalPrice}`);
    });
    
    // Test API formatting
    console.log('\n🔧 Testing slot formatting...');
    const firstSlot = data[0];
    console.log('📝 First slot raw:', JSON.stringify(firstSlot, null, 2));
    
    // Simular el procesamiento que hace ClassesDisplay
    const processedSlot = {
      id: firstSlot.id,
      clubId: firstSlot.clubId || '',
      instructorId: firstSlot.instructorId,
      instructorName: firstSlot.instructorName || 'Sin instructor',
      startTime: new Date(firstSlot.start),
      endTime: new Date(firstSlot.end),
      durationMinutes: 90,
      level: 'abierto',
      category: 'abierta',
      maxPlayers: firstSlot.maxPlayers || 4,
      status: 'forming',
      bookedPlayers: [],
      courtNumber: firstSlot.courtNumber,
      totalPrice: firstSlot.totalPrice,
    };
    
    console.log('✅ Processed slot:', JSON.stringify(processedSlot, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Execute
testClassesApi();