async function debugBookingIssue() {
  try {
    console.log('🔍 Debugeando problema de reservas...');
    
    // 1. Verificar usuarios disponibles
    console.log('\n1️⃣ Verificando usuarios...');
    const usersResponse = await fetch('http://localhost:9002/api/debug-users', {
      method: 'GET'
    });
    
    if (!usersResponse.ok) {
      console.log('❌ No hay endpoint de debug users, creando uno...');
    }
    
    // 2. Verificar clases disponibles
    console.log('\n2️⃣ Verificando clases...');
    const classesResponse = await fetch('http://localhost:9002/api/timeslots?clubId=club-1&date=2025-09-11');
    const classes = await classesResponse.json();
    
    console.log(`📅 Clases disponibles: ${classes.length}`);
    
    // 3. Probar reserva con diferentes usuarios
    const userIds = ['user-alex-test', 'user-alex', 'user-carlos', 'user-ana'];
    
    for (const userId of userIds) {
      console.log(`\n3️⃣ Probando reserva con usuario: ${userId}`);
      
      // Usar la última clase disponible para evitar conflictos
      const targetClass = classes[classes.length - 1];
      
      const bookingData = {
        timeSlotId: targetClass.id,
        userId: userId
      };
      
      console.log(`📝 Datos: ${JSON.stringify(bookingData)}`);
      
      try {
        const response = await fetch('http://localhost:9002/api/classes/book', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bookingData)
        });
        
        const result = await response.text();
        console.log(`📡 Status: ${response.status}`);
        console.log(`📋 Respuesta: ${result.substring(0, 200)}...`);
        
        if (response.ok) {
          console.log(`✅ Funciona con usuario: ${userId}`);
          break;
        } else {
          console.log(`❌ Error con usuario: ${userId}`);
        }
      } catch (error) {
        console.log(`💥 Excepción con ${userId}: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Error general:', error.message);
  }
}

debugBookingIssue();
