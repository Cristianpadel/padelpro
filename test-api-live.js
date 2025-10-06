// Test directo al API en vivo
const testAPI = async () => {
  try {
    console.log('🔍 Testeando API en vivo...');
    const response = await fetch('http://localhost:9002/api/classes/1/bookings');
    
    if (!response.ok) {
      console.error('❌ Error en response:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('✅ Respuesta del API:', data);
    console.log('📊 Total de bookings:', data.length);
    
    // Agrupar por modalidad
    const groupedBySize = data.reduce((acc, booking) => {
      if (!acc[booking.groupSize]) {
        acc[booking.groupSize] = [];
      }
      acc[booking.groupSize].push(booking);
      return acc;
    }, {});
    
    console.log('📋 Agrupado por modalidad:');
    Object.entries(groupedBySize).forEach(([size, bookings]) => {
      console.log(`  ${size}p: ${bookings.length} usuarios -`, 
        bookings.map(b => `${b.name}(${b.status})`).join(', '));
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
};

testAPI();