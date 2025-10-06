import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    console.log('🔍 Checking database structure...');
    
    // Check what tables exist
    const tables = await prisma.$queryRaw`
      SELECT name FROM sqlite_master WHERE type='table' ORDER BY name
    `;
    
    console.log('📋 Tables found:', tables);
    
    // Check User table structure
    const userSchema = await prisma.$queryRaw`
      PRAGMA table_info(User)
    `;
    
    console.log('👤 User table structure:', userSchema);
    
    // Check if other tables exist
    let clubSchema, courtSchema, instructorSchema, timeSlotSchema;
    
    try {
      clubSchema = await prisma.$queryRaw`PRAGMA table_info(Club)`;
      console.log('🏢 Club table structure:', clubSchema);
    } catch (e) {
      console.log('❌ Club table does not exist');
    }
    
    try {
      courtSchema = await prisma.$queryRaw`PRAGMA table_info(Court)`;
      console.log('🏟️ Court table structure:', courtSchema);
    } catch (e) {
      console.log('❌ Court table does not exist');
    }
    
    try {
      instructorSchema = await prisma.$queryRaw`PRAGMA table_info(Instructor)`;
      console.log('👨‍🏫 Instructor table structure:', instructorSchema);
    } catch (e) {
      console.log('❌ Instructor table does not exist');
    }
    
    try {
      timeSlotSchema = await prisma.$queryRaw`PRAGMA table_info(TimeSlot)`;
      console.log('⏰ TimeSlot table structure:', timeSlotSchema);
    } catch (e) {
      console.log('❌ TimeSlot table does not exist');
    }

    return NextResponse.json({
      tables,
      schemas: {
        user: userSchema,
        club: clubSchema,
        court: courtSchema,
        instructor: instructorSchema,
        timeSlot: timeSlotSchema
      }
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
    return NextResponse.json(
      { error: 'Failed to check database structure', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}