const fetch = require('node-fetch');

async function testInstructorsAPI() {
  try {
    console.log('🧪 Testing updated instructors API...\n');
    
    const response = await fetch('http://localhost:9002/api/admin/instructors');
    const data = await response.json();
    
    console.log('📊 API Response Status:', response.status);
    console.log('📊 Total instructors returned:', data.length);
    
    if (data.length > 0) {
      console.log('\n👨‍🏫 Instructors found:');
      data.forEach((instructor, index) => {
        console.log(`\n${index + 1}. ${instructor.name || 'NO NAME'}`);
        console.log(`   - ID: ${instructor.id}`);
        console.log(`   - Email: ${instructor.email || 'NO EMAIL'}`);
        console.log(`   - Club: ${instructor.clubName || 'NO CLUB NAME'}`);
        console.log(`   - Specialties: ${instructor.specialties || 'None'}`);
        console.log(`   - Experience: ${instructor.yearsExperience || 0} years`);
        console.log(`   - Hourly Rate: $${instructor.hourlyRate || 0}`);
        console.log(`   - Active: ${instructor.isActive ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('❌ No instructors returned from API');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testInstructorsAPI();