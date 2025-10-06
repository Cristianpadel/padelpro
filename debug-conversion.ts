import { TimeSlot as ApiTimeSlot } from '@/lib/classesApi';

// Test de conversión individual
console.log('🧪 Testing single slot conversion...');

const testSlot: ApiTimeSlot = {
  id: 'test-slot-1',
  clubId: 'club-1',
  courtId: 'court-1',
  instructorId: 'inst-1',
  instructorName: 'Test Instructor',
  start: '2025-09-08T08:00:00.000Z',
  end: '2025-09-08T09:00:00.000Z',
  maxPlayers: 4,
  totalPrice: 35,
  level: 'principiante',
  category: 'abierta',
  bookedPlayers: 0,
  courtNumber: 1,
  instructorProfilePicture: undefined
};

try {
  const startTime = new Date(testSlot.start);
  const endTime = new Date(testSlot.end);
  
  console.log('Start time:', startTime);
  console.log('End time:', endTime);
  console.log('Start valid:', !isNaN(startTime.getTime()));
  console.log('End valid:', !isNaN(endTime.getTime()));
  
  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  console.log('Duration:', durationMinutes);
  
  console.log('✅ Test conversion successful');
} catch (error) {
  console.error('❌ Test conversion failed:', error);
}

export {};
