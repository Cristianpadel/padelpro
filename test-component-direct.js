// Test directo del componente
async function testComponent() {
  try {
    console.log('🧪 Probando carga de componente...');
    
    const response = await fetch('http://localhost:9002/api/classes/slot-2025-09-15-court-1-18:00/bookings');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API responde correctamente:');
      console.log('📊 Datos recibidos:', data.length, 'reservas');
      data.forEach((booking, index) => {
        console.log(`  ${index + 1}. ${booking.name}: ${booking.groupSize}p - ${booking.status}`);
      });
    } else {
      console.error('❌ Error en API:', response.status);
    }
    
    console.log('\n🔍 Verificando si el problema está en el navegador...');
    console.log('💡 Prueba a:');
    console.log('   1. Refrescar la página (F5 o Ctrl+R)');
    console.log('   2. Abrir herramientas de desarrollador (F12)');
    console.log('   3. Ver console logs para errores de JavaScript');
    
  } catch (error) {
    console.error('❌ Error en test:', error.message);
  }
}

testComponent();