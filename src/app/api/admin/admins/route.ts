import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Fetching admins...');

    // Use raw SQL to avoid schema mismatch issues
    const admins = await prisma.$queryRaw`
      SELECT * FROM Admin ORDER BY createdAt DESC
    `;

    console.log('✅ Found admins:', admins.length);
    return NextResponse.json(admins);
  } catch (error) {
    console.error('❌ Error fetching admins:', error.message, error.stack);
    return NextResponse.json(
      { error: 'Failed to fetch admins', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, role, phone } = body;

    // Validación básica
    if (!name || !email || !role) {
      return NextResponse.json(
        { error: 'Name, email, and role are required' },
        { status: 400 }
      );
    }

    // Validar que el rol sea válido para administrador
    if (!['CLUB_ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid admin role' },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: 'Admin with this email already exists' },
        { status: 400 }
      );
    }

    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        role,
        phone
      }
    });

    return NextResponse.json(newAdmin, { status: 201 });
  } catch (error) {
    console.error('Error creating admin:', error);
    return NextResponse.json(
      { error: 'Failed to create admin' },
      { status: 500 }
    );
  }
}