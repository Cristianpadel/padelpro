// API simplificada para debug
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    console.log('🔍 POST /api/classes/book - Starting...');
    
    let body;
    try {
      body = await request.json();
      console.log('📝 Body parsed successfully:', body);
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }
    
    const { userId, timeSlotId, groupSize = 1 } = body;
    console.log('📊 Extracted:', { userId, timeSlotId, groupSize });

    if (!userId || !timeSlotId) {
      console.log('❌ Missing fields');
      return NextResponse.json({ error: 'Missing userId or timeSlotId' }, { status: 400 });
    }

    // Verificar que el slot existe
    console.log('🔍 Checking timeSlot...');
    const timeSlot = await prisma.timeSlot.findUnique({
      where: { id: timeSlotId }
    });

    if (!timeSlot) {
      console.log('❌ TimeSlot not found');
      return NextResponse.json({ error: 'TimeSlot not found' }, { status: 404 });
    }
    console.log('✅ TimeSlot found');

    // Verificar usuario
    console.log('🔍 Checking user...');
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      console.log('❌ User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    console.log('✅ User found');

    // Crear booking
    console.log('🔧 Creating booking...');
    const booking = await prisma.booking.create({
      data: {
        userId,
        timeSlotId,
        groupSize
      }
    });
    console.log('✅ Booking created:', booking.id);

    return NextResponse.json({
      success: true,
      booking
    });

  } catch (error) {
    console.error('❌ Detailed error:', error);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}