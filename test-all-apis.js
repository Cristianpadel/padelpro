// Test todas las APIs de bookings
async function testAllBookingsAPIs() {
  try {
    console.log('🧪 Testing all bookings APIs...');
    
    const timeSlots = [
      'cmfwmpa0h0005tgf4a2xzo1r5', // Principiante 18:00
      'cmfwmpa3u0006tgf4jrm64xkz', // Intermedio 19:00
      'cmfwmpa400007tgf4w3kqigrr'  // Avanzado 20:00
    ];
    
    for (const timeSlotId of timeSlots) {
      console.log(`\n📞 Testing timeSlot: ${timeSlotId}`);
      
      try {
        const response = await fetch(`http://localhost:9002/api/classes/${timeSlotId}/bookings`);
        
        if (response.ok) {
          const bookings = await response.json();
          console.log(`✅ Found ${bookings.length} bookings`);
          
          bookings.forEach(booking => {
            if (booking.userId === 'cmfwmut4v0001tgs0en3il18d') {
              console.log(`   🎯 Alex García: groupSize=${booking.groupSize}, name="${booking.name}"`);
            }
          });
        } else {
          console.log(`❌ Error ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Fetch error: ${error.message}`);
      }
    }
    
    // También probar la API principal de timeslots
    console.log('\n📞 Testing main timeslots API...');
    try {
      const response = await fetch('http://localhost:9002/api/timeslots?clubId=basic-club&date=2025-09-23');
      
      if (response.ok) {
        const slots = await response.json();
        console.log(`✅ Found ${slots.length} time slots`);
        
        slots.forEach(slot => {
          console.log(`   - Slot ${slot.id}: ${slot.bookedPlayers} players booked`);
        });
      } else {
        console.log(`❌ Timeslots API error: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Timeslots API fetch error: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAllBookingsAPIs();