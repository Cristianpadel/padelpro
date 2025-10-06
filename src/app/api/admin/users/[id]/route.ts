import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Check if user has bookings
    const bookings = await prisma.booking.findMany({
      where: { userId: id }
    });

    if (bookings.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete user with existing bookings' },
        { status: 400 }
      );
    }

    await prisma.user.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, email, role, level, genderCategory, phone, profilePictureUrl } = body;

    console.log(`📝 Updating user ${id} with:`, body);

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(role && { role }),
        ...(level && { level }),
        ...(genderCategory && { genderCategory }),
        ...(phone !== undefined && { phone }),
        ...(profilePictureUrl !== undefined && { profilePictureUrl })
      }
    });

    console.log(`✅ User updated successfully:`, user.name);

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}