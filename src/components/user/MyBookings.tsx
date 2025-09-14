// src/components/user/MyBookings.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, User, Calendar, Euro, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface BookingData {
  id: string;
  status: string;
  createdAt: string;
  timeSlot: {
    id: string;
    start: string;
    end: string;
    level: string;
    category: string;
    totalPrice: number;
    maxPlayers: number;
    courtNumber: string;
    instructorName: string;
    instructorProfilePicture?: string;
  };
}

interface MyBookingsProps {
  userId?: string;
  currentUser?: any;
  onBookingUpdate?: () => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ 
  userId = 'user-alex', 
  currentUser,
  onBookingUpdate 
}) => {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBookings();
  }, [userId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching bookings for user:', userId);

      const response = await fetch(`/api/my/bookings?userId=${userId}`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las reservas');
      }

      const data = await response.json();
      
      if (data.success) {
        setBookings(data.bookings);
        console.log('📋 Bookings loaded:', data.bookings.length);
      } else {
        throw new Error(data.message || 'Error desconocido');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'CONFIRMED': 'bg-green-100 text-green-800 border-green-200',
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />;
      case 'PENDING':
        return <AlertCircle className="h-4 w-4" />;
      case 'CANCELLED':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      'principiante': 'bg-green-500',
      'intermedio': 'bg-yellow-500',
      'avanzado': 'bg-orange-500',
      'competicion': 'bg-red-500',
    };
    return colors[level.toLowerCase()] || 'bg-gray-500';
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return {
        date: format(date, 'dd/MM/yyyy', { locale: es }),
        time: format(date, 'HH:mm', { locale: es }),
        fullDate: format(date, "eeee, d 'de' MMMM", { locale: es })
      };
    } catch {
      return { date: 'N/A', time: 'N/A', fullDate: 'N/A' };
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Mis Reservas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
            <span className="ml-2">Cargando reservas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Mis Reservas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchBookings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Mis Reservas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No tienes reservas activas</p>
            <p className="text-sm text-gray-500">¡Reserva tu primera clase para empezar!</p>
            <Button 
              onClick={fetchBookings} 
              variant="outline" 
              className="mt-4"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Mis Reservas</span>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary">
              {bookings.length} {bookings.length === 1 ? 'reserva' : 'reservas'}
            </Badge>
            <Button onClick={fetchBookings} variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {bookings.map((booking) => {
          const startDateTime = formatDateTime(booking.timeSlot.start);
          const endDateTime = formatDateTime(booking.timeSlot.end);
          const createdDateTime = formatDateTime(booking.createdAt);

          return (
            <Card key={booking.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", getStatusColor(booking.status))}
                    >
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(booking.status)}
                        <span>{booking.status}</span>
                      </div>
                    </Badge>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>Reservado: {createdDateTime.date}</div>
                    <div>{createdDateTime.time}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Información de la clase */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <div>
                        <div className="font-medium">
                          {startDateTime.time} - {endDateTime.time}
                        </div>
                        <div className="text-sm text-gray-600 capitalize">
                          {startDateTime.fullDate}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span>{booking.timeSlot.instructorName}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>Cancha {booking.timeSlot.courtNumber || 'No asignada'}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Euro className="h-4 w-4 text-green-600" />
                      <span className="font-semibold text-green-600">
                        {booking.timeSlot.totalPrice}€
                      </span>
                    </div>
                  </div>

                  {/* Detalles del nivel y categoría */}
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={cn(
                          "w-3 h-3 rounded-full",
                          getLevelColor(booking.timeSlot.level)
                        )}
                      />
                      <span className="text-sm font-medium capitalize">
                        {booking.timeSlot.level}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm capitalize">
                        {booking.timeSlot.category}
                      </span>
                    </div>

                    <div className="text-sm text-gray-500">
                      <div>ID: {booking.id.substring(0, 8)}...</div>
                      <div>Clase ID: {booking.timeSlot.id.substring(0, 8)}...</div>
                    </div>
                  </div>
                </div>

                {/* Información adicional */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <span>Capacidad: {booking.timeSlot.maxPlayers} jugadores</span>
                    <Badge variant="outline" className="text-xs">
                      {booking.status === 'CONFIRMED' ? 'Confirmada' : 
                       booking.status === 'PENDING' ? 'Pendiente' : 'Cancelada'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default MyBookings;