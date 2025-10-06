import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clubId = searchParams.get('clubId');

    // Construir el filtro basado en clubId
    const where = clubId ? { clubId } : {};

    const timeSlots = await prisma.timeSlot.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(timeSlots);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch time slots' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clubId, 
      courtId, 
      instructorId, 
      start, 
      end, 
      maxPlayers, 
      totalPrice, 
      level, 
      category 
    } = body;

    // Validación básica
    if (!clubId || !start || !end) {
      return NextResponse.json(
        { error: 'Missing required fields: clubId, start, end' },
        { status: 400 }
      );
    }

    // Validar que las fechas sean válidas
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (startDate >= endDate) {
      return NextResponse.json(
        { error: 'Start time must be before end time' },
        { status: 400 }
      );
    }

    // Verificar que el club existe
    const club = await prisma.club.findUnique({
      where: { id: clubId }
    });

    if (!club) {
      return NextResponse.json(
        { error: 'Club not found' },
        { status: 404 }
      );
    }

    // Verificar que la pista existe si se especifica
    if (courtId) {
      const court = await prisma.court.findUnique({
        where: { id: courtId }
      });

      if (!court || court.clubId !== clubId) {
        return NextResponse.json(
          { error: 'Court not found or does not belong to the specified club' },
          { status: 404 }
        );
      }
    }

    // Verificar que el instructor existe si se especifica
    if (instructorId) {
      const instructor = await prisma.instructor.findUnique({
        where: { id: instructorId }
      });

      if (!instructor || instructor.clubId !== clubId) {
        return NextResponse.json(
          { error: 'Instructor not found or does not belong to the specified club' },
          { status: 404 }
        );
      }
    }

    // Crear el timeslot
    const timeSlot = await prisma.timeSlot.create({
      data: {
        clubId,
        courtId: courtId || null,
        instructorId: instructorId || null,
        start: startDate,
        end: endDate,
        maxPlayers: maxPlayers || 4,
        totalPrice: totalPrice || 25,
        level: level || 'abierto',
        category: category || 'class'
      }
    });

    return NextResponse.json(timeSlot, { status: 201 });
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { error: 'Failed to create time slot' },
      { status: 500 }
    );
  }
}