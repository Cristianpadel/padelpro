// test-instructor-crud.js
const fetch = require('node-fetch');

async function testInstructorCRUD() {
  try {
    console.log('🔍 Testing instructor CRUD operations...');
    
    // 1. Get instructor by ID
    console.log('\n1. Testing GET instructor by ID...');
    const instructorId = 'instructor-1758833315064-j5zqj7vwg'; // María Instructora
    
    const getResponse = await fetch(`http://localhost:9002/api/admin/instructors/${instructorId}`);
    console.log('GET Response status:', getResponse.status);
    
    if (getResponse.ok) {
      const instructor = await getResponse.json();
      console.log('✅ Instructor found:', instructor.specialties, instructor.yearsExperience);
    } else {
      console.log('❌ Failed to get instructor');
    }
    
    // 2. Update instructor
    console.log('\n2. Testing PUT instructor update...');
    const updateData = {
      id: instructorId,
      specialties: 'Pádel Avanzado',
      experience: '5-10 años',
      hourlyRate: 35.0,
      bio: 'Instructora experimentada especializada en técnicas avanzadas',
      isActive: true
    };
    
    const putResponse = await fetch('http://localhost:9002/api/admin/instructors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });
    
    console.log('PUT Response status:', putResponse.status);
    if (putResponse.ok) {
      const updated = await putResponse.json();
      console.log('✅ Instructor updated:', updated.specialties, updated.yearsExperience, updated.hourlyRate);
    } else {
      const error = await putResponse.text();
      console.log('❌ Failed to update instructor:', error);
    }
    
    // 3. Verify update
    console.log('\n3. Verifying update...');
    const verifyResponse = await fetch(`http://localhost:9002/api/admin/instructors/${instructorId}`);
    if (verifyResponse.ok) {
      const verified = await verifyResponse.json();
      console.log('✅ Updated instructor verified:', verified.specialties, verified.yearsExperience, verified.hourlyRate);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testInstructorCRUD();