// src/app/api/debug/user/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    console.log('=== DEBUG USER ENDPOINT ===');
    
    // Obtener todos los usuarios disponibles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Available users:', users);
    
    return NextResponse.json({
      message: 'Debug user info',
      availableUsers: users,
      recommendedTestUser: 'user-alex-test',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in debug user endpoint:', error);
    return NextResponse.json(
      { message: 'Error getting user debug info', error: String(error) },
      { status: 500 }
    );
  }
}
