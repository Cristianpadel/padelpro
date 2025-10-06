'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Clock, Users, MapPin, Star, Calendar } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface AdminBookingCardLegacyProps {
  booking: {
    id: string;
    userId: string;
    timeSlotId: string;
    groupSize: number;
    status: string;
    createdAt: string;
    userName: string | null;
    userLevel: string | null;
    userGender: string | null;
    start: string;
    end: string;
    maxPlayers: number;
    totalPrice: number | null;
    classLevel: string | null;
    classCategory: string | null;
    instructorName: string | null;
    instructorProfilePicture: string | null;
    courtNumber: number | null;
    bookedPlayers: number;
  };
}

// Funciones de mapeo dinámico (copiadas de ClassCardReal)
const getDynamicCategory = (bookings: any[]): string => {
  if (!bookings || bookings.length === 0) return 'Mixto';
  
  const firstBooking = bookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  
  if (firstBooking.userGender === 'masculino') return 'Chico';
  if (firstBooking.userGender === 'chica' || firstBooking.userGender === 'femenino') return 'Chica';
  return 'Mixto';
};

const getDynamicLevel = (bookings: any[]): string => {
  if (!bookings || bookings.length === 0) return 'Abierto';
  
  const firstBooking = bookings.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())[0];
  
  const levelMap: { [key: string]: string } = {
    'principiante': '1.0-2.0',
    'inicial-medio': '2.0-3.5',
    'intermedio': '3.5-4.5',
    'avanzado': '4.0-5.5',
    'abierto': 'Abierto'
  };
  
  return levelMap[firstBooking.userLevel] || 'Abierto';
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'confirmed':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'cancelled':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
};

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function AdminBookingCardLegacy({ booking }: AdminBookingCardLegacyProps) {
  // Simular array de bookings para las funciones dinámicas
  const mockBookings = [{
    createdAt: booking.createdAt,
    userGender: booking.userGender,
    userLevel: booking.userLevel
  }];

  const dynamicCategory = getDynamicCategory(mockBookings);
  const dynamicLevel = getDynamicLevel(mockBookings);
  
  const occupancyPercentage = (booking.bookedPlayers / booking.maxPlayers) * 100;
  const isFullyBooked = booking.bookedPlayers >= booking.maxPlayers;

  return (
    <Card className="w-full max-w-sm mx-auto hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-4 space-y-3">
        {/* Header con estado de reserva */}
        <div className="flex items-center justify-between">
          <Badge className={`text-xs font-medium ${getStatusColor(booking.status)}`}>
            {booking.status}
          </Badge>
          <span className="text-xs text-gray-500">
            ID: {booking.id.slice(-8)}
          </span>
        </div>

        {/* Fecha y hora */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-600" />
            <span className="text-sm font-medium">{formatDate(booking.start)}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4 text-gray-600" />
            <span className="text-sm">
              {formatTime(booking.start)} - {formatTime(booking.end)}
            </span>
          </div>
        </div>

        {/* Instructor */}
        {booking.instructorName && (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage 
                src={booking.instructorProfilePicture || ''} 
                alt={booking.instructorName} 
              />
              <AvatarFallback className="text-xs">
                {getInitials(booking.instructorName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{booking.instructorName}</p>
              <p className="text-xs text-gray-500">Instructor</p>
            </div>
          </div>
        )}

        {/* Nivel y categoría dinámicos */}
        <div className="flex space-x-2">
          <Badge variant="outline" className="text-xs">
            {dynamicLevel}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {dynamicCategory}
          </Badge>
        </div>

        {/* Información del usuario que reservó */}
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">
                {booking.userName || 'Usuario desconocido'}
              </p>
              <p className="text-xs text-blue-700">
                Nivel: {booking.userLevel} • Género: {booking.userGender}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Grupo de {booking.groupSize}
            </Badge>
          </div>
        </div>

        {/* Ocupación */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-600" />
              <span>Ocupación</span>
            </div>
            <span className={`font-medium ${isFullyBooked ? 'text-red-600' : 'text-green-600'}`}>
              {booking.bookedPlayers}/{booking.maxPlayers}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                isFullyBooked ? 'bg-red-500' : occupancyPercentage > 75 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(occupancyPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Precio y cancha */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center space-x-1">
            <MapPin className="h-4 w-4 text-gray-600" />
            <span className="text-sm">Cancha {booking.courtNumber || 'N/A'}</span>
          </div>
          {booking.totalPrice && (
            <span className="text-lg font-bold text-green-600">
              €{booking.totalPrice}
            </span>
          )}
        </div>

        {/* Fecha de reserva */}
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          Reservado el {new Date(booking.createdAt).toLocaleString('es-ES')}
        </div>
      </CardContent>
    </Card>
  );
}