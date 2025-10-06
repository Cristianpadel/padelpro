'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, 
  User, 
  MapPin, 
  Euro, 
  Calendar, 
  X, 
  CheckCircle,
  Users,
  Star
} from 'lucide-react';

interface BookingCardProps {
  booking: {
    id: string;
    timeSlotId: string;
    groupSize: number;
    status: string;
    createdAt: string;
    classStatus: {
      totalBookings: number;
      isCompleted: boolean;
      isPast: boolean;
    };
    timeSlot: {
      id: string;
      start: string;
      end: string;
      totalPrice: number;
      maxPlayers: number;
      level?: string;
      category?: string;
      instructor: {
        name: string;
        profilePictureUrl?: string;
      };
      court?: {
        number: number;
      };
    };
  };
  onCancel?: (bookingId: string, timeSlotId: string) => void;
  onRefresh?: () => void;
}

export default function MyBookingCard({ booking, onCancel, onRefresh }: BookingCardProps) {
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const handleCancel = async () => {
    if (!onCancel) return;
    
    const confirmCancel = window.confirm(
      '¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.'
    );
    
    if (!confirmCancel) return;

    setCancelling(true);
    try {
      await onCancel(booking.id, booking.timeSlotId);
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error al cancelar:', error);
    } finally {
      setCancelling(false);
    }
  };

  const startTime = format(new Date(booking.timeSlot.start), 'HH:mm', { locale: es });
  const endTime = format(new Date(booking.timeSlot.end), 'HH:mm', { locale: es });
  const startDate = format(new Date(booking.timeSlot.start), 'EEEE, dd MMMM yyyy', { locale: es });
  const isUpcoming = new Date(booking.timeSlot.start) > new Date();
  const isPast = booking.classStatus.isPast;
  const isCompleted = booking.classStatus.isCompleted;

  const getLevelColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-500';
    
    const colors: Record<string, string> = {
      'principiante': 'bg-green-500',
      'intermedio': 'bg-yellow-500', 
      'avanzado': 'bg-orange-500',
      'competicion': 'bg-red-500',
      'abierto': 'bg-blue-500'
    };
    return colors[level.toLowerCase()] || 'bg-gray-500';
  };

  const getCategoryBadgeColor = (category: string | undefined) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    const colors: Record<string, string> = {
      'femenina': 'bg-pink-100 text-pink-800',
      'masculina': 'bg-blue-100 text-blue-800', 
      'mixto': 'bg-purple-100 text-purple-800',
      'abierto': 'bg-green-100 text-green-800',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusInfo = () => {
    if (isPast) {
      return {
        badge: { text: 'Completada', color: 'bg-gray-100 text-gray-800' },
        cardStyle: 'opacity-75 border-gray-200'
      };
    }
    if (isCompleted) {
      return {
        badge: { text: 'Clase Confirmada', color: 'bg-green-100 text-green-800' },
        cardStyle: 'border-l-4 border-l-green-500 shadow-md'
      };
    }
    return {
      badge: { text: 'En Formación', color: 'bg-yellow-100 text-yellow-800' },
      cardStyle: 'border-l-4 border-l-yellow-500'
    };
  };

  const statusInfo = getStatusInfo();
  const pricePerPerson = booking.timeSlot.totalPrice / booking.timeSlot.maxPlayers;
  const myTotalPrice = pricePerPerson * booking.groupSize;

  return (
    <Card className={`transition-all hover:shadow-lg ${statusInfo.cardStyle}`}>
      <CardContent className="p-6">
        {/* Header con fecha y estado */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-lg capitalize text-gray-900">
                  {startDate}
                </p>
                <p className="text-gray-600 font-medium">
                  {startTime} - {endTime}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge className={statusInfo.badge.color}>
              {statusInfo.badge.text}
            </Badge>
            {isCompleted && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
          </div>
        </div>

        {/* Información de la clase */}
        <div className="space-y-3 mb-4">
          {/* Instructor y Cancha */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{booking.timeSlot.instructor.name}</span>
            </div>
            
            {booking.timeSlot.court && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <span>Cancha {booking.timeSlot.court.number}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span>
                {booking.classStatus.totalBookings}/{booking.timeSlot.maxPlayers} jugadores
              </span>
            </div>
          </div>

          {/* Level y Category */}
          <div className="flex items-center gap-3">
            {booking.timeSlot.level && (
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getLevelColor(booking.timeSlot.level)}`} />
                <span className="text-sm font-medium capitalize">
                  {booking.timeSlot.level}
                </span>
              </div>
            )}
            
            {booking.timeSlot.category && (
              <Badge variant="outline" className={`text-xs capitalize ${getCategoryBadgeColor(booking.timeSlot.category)}`}>
                {booking.timeSlot.category}
              </Badge>
            )}
          </div>

          {/* Mi reserva específica */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-blue-600 fill-current" />
                <span className="text-sm font-medium text-blue-800">
                  Tu reserva: {booking.groupSize} jugador{booking.groupSize > 1 ? 'es' : ''}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Euro className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-green-700">
                  {myTotalPrice.toFixed(2)}€
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer con acciones */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">
            Reservado: {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
          </p>
          
          {/* Botón de cancelar solo para clases futuras */}
          {isUpcoming && !isPast && (
            <Button
              onClick={handleCancel}
              disabled={cancelling}
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
            >
              {cancelling ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Cancelando...
                </>
              ) : (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}