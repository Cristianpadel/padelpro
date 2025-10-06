import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching instructors...');
    
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    // Use raw SQL with JOIN to get instructor data with user names
    let instructors;
    if (clubId) {
      instructors = await prisma.$queryRaw`
        SELECT 
          i.id,
          i.userId,
          i.clubId,
          i.hourlyRate,
          i.bio,
          i.yearsExperience,
          i.specialties,
          i.isActive,
          i.createdAt,
          i.updatedAt,
          u.name,
          u.email,
          u.profilePictureUrl,
          c.name as clubName
        FROM Instructor i
        LEFT JOIN User u ON i.userId = u.id
        LEFT JOIN Club c ON i.clubId = c.id
        WHERE i.clubId = ${clubId} 
        ORDER BY i.createdAt DESC
      `;
    } else {
      instructors = await prisma.$queryRaw`
        SELECT 
          i.id,
          i.userId,
          i.clubId,
          i.hourlyRate,
          i.bio,
          i.yearsExperience,
          i.specialties,
          i.isActive,
          i.createdAt,
          i.updatedAt,
          u.name,
          u.email,
          u.profilePictureUrl,
          c.name as clubName
        FROM Instructor i
        LEFT JOIN User u ON i.userId = u.id
        LEFT JOIN Club c ON i.clubId = c.id
        ORDER BY i.createdAt DESC
      `;
    }

    console.log('✅ Found instructors:', instructors.length);
    console.log('📋 First instructor example:', instructors[0] ? {
      id: instructors[0].id,
      name: instructors[0].name,
      clubName: instructors[0].clubName,
      specialties: instructors[0].specialties
    } : 'No instructors found');
    
    return NextResponse.json(instructors);
  } catch (error) {
    console.error('❌ Error fetching instructors:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch instructors', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📋 Received instructor data:', body);
    
    const { userId, clubId, specialties, experience } = body;

    if (!userId || !clubId) {
      console.log('❌ Missing required fields:', { userId, clubId });
      return NextResponse.json(
        { error: 'userId and clubId are required' },
        { status: 400 }
      );
    }

    // Check if instructor already exists using raw SQL
    const existingInstructors = await prisma.$queryRaw`
      SELECT * FROM Instructor WHERE userId = ${userId}
    `;

    if (existingInstructors.length > 0) {
      console.log('❌ Instructor already exists for user:', userId);
      return NextResponse.json(
        { error: 'Instructor already exists for this user' },
        { status: 400 }
      );
    }

    // Convertir experiencia de texto a número
    let yearsExperience = 0;
    if (experience) {
      if (experience.includes('1-2')) yearsExperience = 1;
      else if (experience.includes('3-5')) yearsExperience = 3;
      else if (experience.includes('5-10')) yearsExperience = 5;
      else if (experience.includes('10')) yearsExperience = 10;
    }

    // Generate a unique ID
    const instructorId = `instructor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log('🔍 Creating instructor with data:', {
      id: instructorId,
      userId,
      clubId,
      specialties,
      yearsExperience,
      hourlyRate: 30.0
    });

    // Use raw SQL to create instructor
    await prisma.$executeRaw`
      INSERT INTO Instructor (id, userId, clubId, specialties, yearsExperience, hourlyRate, isActive, createdAt, updatedAt)
      VALUES (${instructorId}, ${userId}, ${clubId}, ${specialties || ''}, ${yearsExperience}, 30.0, 1, datetime('now'), datetime('now'))
    `;
    
    // Get the created instructor using raw SQL
    const createdInstructors = await prisma.$queryRaw`
      SELECT * FROM Instructor WHERE id = ${instructorId}
    `;
    
    const createdInstructor = createdInstructors[0];

    console.log('✅ Instructor created:', createdInstructor);
    return NextResponse.json(createdInstructor);
  } catch (error) {
    console.error('❌ Error creating instructor:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to create instructor', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📋 Received instructor update data:', body);
    
    const { id, specialties, experience, hourlyRate, bio, isActive, profilePictureUrl, userId } = body;

    if (!id) {
      console.log('❌ Missing instructor ID');
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    // Convertir experiencia de texto a número
    let yearsExperience = 0;
    if (experience) {
      if (experience.includes('1-2')) yearsExperience = 1;
      else if (experience.includes('3-5')) yearsExperience = 3;
      else if (experience.includes('5-10')) yearsExperience = 5;
      else if (experience.includes('10')) yearsExperience = 10;
    }

    console.log('🔍 Updating instructor with data:', {
      id,
      specialties,
      yearsExperience,
      hourlyRate: hourlyRate || 30.0,
      bio: bio || null,
      isActive: isActive !== undefined ? isActive : true,
      profilePictureUrl: profilePictureUrl || null
    });

    // Use raw SQL to update instructor
    await prisma.$executeRaw`
      UPDATE Instructor 
      SET specialties = ${specialties || ''}, 
          yearsExperience = ${yearsExperience}, 
          hourlyRate = ${hourlyRate || 30.0},
          bio = ${bio || null},
          isActive = ${isActive !== undefined ? (isActive ? 1 : 0) : 1},
          updatedAt = datetime('now')
      WHERE id = ${id}
    `;
    
    // Si se proporciona una foto de perfil y el userId, actualizar también el usuario
    if (profilePictureUrl !== undefined && userId) {
      console.log('🖼️ Updating user profile picture:', { userId, profilePictureUrl });
      await prisma.$executeRaw`
        UPDATE User 
        SET profilePictureUrl = ${profilePictureUrl}
        WHERE id = ${userId}
      `;
    }
    
    // Get the updated instructor with user data
    const updatedInstructors = await prisma.$queryRaw`
      SELECT 
        i.*,
        u.name,
        u.email,
        u.profilePictureUrl
      FROM Instructor i
      LEFT JOIN User u ON i.userId = u.id
      WHERE i.id = ${id}
    `;
    
    if (updatedInstructors.length === 0) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }
    
    const updatedInstructor = updatedInstructors[0];

    console.log('✅ Instructor updated:', updatedInstructor);
    return NextResponse.json(updatedInstructor);
  } catch (error) {
    console.error('❌ Error updating instructor:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to update instructor', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      console.log('❌ Missing instructor ID');
      return NextResponse.json(
        { error: 'Instructor ID is required' },
        { status: 400 }
      );
    }

    console.log('🔍 Deleting instructor with ID:', id);

    // Check if instructor exists
    const existingInstructors = await prisma.$queryRaw`
      SELECT * FROM Instructor WHERE id = ${id}
    `;

    if (existingInstructors.length === 0) {
      return NextResponse.json(
        { error: 'Instructor not found' },
        { status: 404 }
      );
    }

    // Use raw SQL to delete instructor
    await prisma.$executeRaw`
      DELETE FROM Instructor WHERE id = ${id}
    `;

    console.log('✅ Instructor deleted successfully');
    return NextResponse.json({ message: 'Instructor deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting instructor:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to delete instructor', details: error.message },
      { status: 500 }
    );
  }
}