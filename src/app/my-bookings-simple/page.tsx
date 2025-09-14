'use client';

import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, User, MapPin, Euro, Calendar, RefreshCw, X, AlertTriangle } from 'lucide-react';

interface BookingData {
  id: string;
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
    };
    court?: {
      number: number;
    };
  };
  status: string;
  createdAt: string;
}

export default function MyBookingsSimple() {
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Control de montaje para evitar actualizaciones en componente desmontado
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (mounted) {
      fetchBookings();
    }
  }, [mounted]);

  // Memoizar la lista de bookings procesados para evitar re-renders innecesarios
  const processedBookings = useMemo(() => {
    return bookings
      // Filtrar bookings válidos para evitar errores de renderizado
      .filter(booking => booking && booking.id && booking.timeSlot && booking.timeSlot.id)
      .sort((a, b) => new Date(a.timeSlot.start).getTime() - new Date(b.timeSlot.start).getTime());
  }, [bookings]);

  const fetchBookings = async () => {
    if (!mounted) return;
    
    try {
      setLoading(true);
      console.log('🔍 Fetching bookings...');
      
      // 🔧 TEMPORAL: Forzar user-1 para evitar problemas de cache
      const forceUserId = 'user-1';
      console.log('🔧 FORZANDO USER ID para mis reservas:', forceUserId);
      
      const response = await fetch(`/api/my/bookings?userId=${forceUserId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📥 API response:', data);
      
      // Manejar tanto arrays directos como objetos con propiedad value
      const bookingsArray = Array.isArray(data) ? data : (data.value || []);
      console.log('📋 Bookings count:', bookingsArray.length);
      
      // Solo actualizar si el componente sigue montado
      if (mounted) {
        setBookings(bookingsArray);
      }
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      if (mounted) {
        setBookings([]);
      }
    } finally {
      if (mounted) {
        setLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    if (!mounted) return;
    setRefreshing(true);
    await fetchBookings();
    if (mounted) {
      setRefreshing(false);
    }
  };

  const handleCancelBooking = async (bookingId: string, timeSlotId: string) => {
    if (!mounted || cancelling || typeof window === 'undefined') return;
    
    // Confirmación antes de cancelar
    const confirmCancel = window.confirm(
      '¿Estás seguro de que quieres cancelar esta reserva? Esta acción no se puede deshacer.'
    );
    
    if (!confirmCancel) return;

    try {
      setCancelling(bookingId);
      
      const response = await fetch('/api/classes/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: 'user-1', // 🔧 Usar user-1 consistente con el resto
          timeSlotId: timeSlotId,
        })
      });

      if (response.ok && mounted) {
        console.log('✅ Reserva cancelada exitosamente');
        alert('✅ Reserva cancelada exitosamente');
        
        // Hacer una recarga completa después de un pequeño delay
        setTimeout(async () => {
          if (mounted) {
            await fetchBookings();
          }
        }, 500);
      } else if (mounted) {
        const error = await response.json();
        console.error('❌ Error al cancelar:', error);
        alert('Error al cancelar la reserva: ' + (error.error || 'Error desconocido'));
      }
    } catch (error) {
      console.error('❌ Error de conexión:', error);
      if (mounted) {
        alert('Error de conexión al cancelar la reserva');
      }
    } finally {
      if (mounted) {
        setCancelling(null);
      }
    }
  };

  const getLevelColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-500';
    
    const colors: Record<string, string> = {
      'principiante': 'bg-green-500',
      'intermedio': 'bg-yellow-500',
      'avanzado': 'bg-orange-500',
      'competicion': 'bg-red-500',
    };
    return colors[level.toLowerCase()] || 'bg-gray-500';
  };

  const getCategoryColor = (category: string | undefined) => {
    if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const colors: Record<string, string> = {
      'femenina': 'bg-pink-100 text-pink-800 border-pink-200',
      'masculina': 'bg-blue-100 text-blue-800 border-blue-200',
      'abierta': 'bg-purple-100 text-purple-800 border-purple-200',
      'infantil': 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[category.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando tus reservas...</span>
        </div>
        <div className="text-center text-sm text-gray-500 mt-4 space-y-2">
          <p>🔍 Conectando a: /api/my/bookings?userId=user-1</p>
          <Button 
            onClick={() => {
              console.log('🔄 Manual reload triggered');
              fetchBookings();
            }}
            variant="outline"
            className="mt-4"
          >
            🔄 Forzar recarga
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Mis Reservas</h1>
          <p className="text-gray-600 mt-1">
            Aquí puedes ver todas tus clases reservadas
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </Button>
      </div>

      {/* Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-blue-800 mb-2">🔍 Debug Information</h4>
        <div className="text-sm text-blue-700 space-y-1">
          <p><strong>API Endpoint:</strong> /api/my/bookings?userId=user-1</p>
          <p><strong>Component mounted:</strong> {mounted ? 'Yes' : 'No'}</p>
          <p><strong>Loading state:</strong> {loading ? 'Loading...' : 'Loaded'}</p>
          <p><strong>Total bookings loaded:</strong> {bookings.length}</p>
          {bookings.length > 0 && (
            <p><strong>First booking ID:</strong> {bookings[0]?.id}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Total Reservas</p>
                <p className="text-2xl font-bold text-gray-900">{processedBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Próximas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processedBookings.filter(b => new Date(b.timeSlot.start) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {processedBookings.reduce((sum, booking) => {
                    const pricePerPerson = booking.timeSlot.totalPrice / booking.timeSlot.maxPlayers;
                    return sum + pricePerPerson;
                  }, 0).toFixed(2)}€
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      {processedBookings.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No tienes reservas activas
            </h3>
            <p className="text-gray-600 mb-4">
              ¡Es hora de reservar tu primera clase de pádel!
            </p>
            <Button asChild>
              <a href="/activities?view=clases">
                Explorar Clases
              </a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {processedBookings.map((booking, index) => {
              // Usar una key estable basada solo en el ID del booking
              const uniqueKey = `booking-${booking.id}`;
              
              // Validar que tenemos los datos necesarios antes de renderizar
              if (!booking.timeSlot?.start || !booking.timeSlot?.end) {
                return null;
              }
              
              const startTime = format(new Date(booking.timeSlot.start), 'HH:mm', { locale: es });
              const endTime = format(new Date(booking.timeSlot.end), 'HH:mm', { locale: es });
              const startDate = format(new Date(booking.timeSlot.start), 'EEEE, dd MMMM yyyy', { locale: es });
              const pricePerPerson = booking.timeSlot.totalPrice / booking.timeSlot.maxPlayers;
              const isUpcoming = new Date(booking.timeSlot.start) > new Date();
              
              return (
                <Card 
                  key={uniqueKey}
                  className={`transition-all hover:shadow-md ${isUpcoming ? 'border-l-4 border-l-blue-500' : 'opacity-75'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Información principal */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" />
                            <div suppressHydrationWarning={true}>
                              <p className="font-semibold text-lg capitalize">
                                {startDate}
                              </p>
                              <p className="text-gray-600">
                                {startTime} - {endTime}
                              </p>
                            </div>
                          </div>
                          
                          {isUpcoming && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              Próxima
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span>{booking.timeSlot.instructor.name}</span>
                          </div>
                          
                          {booking.timeSlot.court && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-500" />
                              <span>Cancha {booking.timeSlot.court.number}</span>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            <Euro className="h-4 w-4 text-green-600" />
                            <span className="font-semibold">{pricePerPerson.toFixed(2)}€</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {booking.timeSlot.level && (
                            <div className="flex items-center gap-2">
                              <div 
                                className={`w-3 h-3 rounded-full ${getLevelColor(booking.timeSlot.level)}`}
                              />
                              <span className="text-sm font-medium capitalize">
                                {booking.timeSlot.level}
                              </span>
                            </div>
                          )}
                          
                          {booking.timeSlot.category && (
                            <Badge 
                              variant="outline" 
                              className={`text-xs capitalize ${getCategoryColor(booking.timeSlot.category)}`}
                            >
                              {booking.timeSlot.category}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Estado y acciones */}
                      <div className="flex flex-col items-end gap-3">
                        <Badge 
                          variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}
                          className={booking.status === 'CONFIRMED' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                          }
                        >
                          {booking.status === 'CONFIRMED' ? 'Confirmada' : booking.status}
                        </Badge>
                        
                        {/* Botón de cancelar solo para reservas próximas */}
                        {isUpcoming && (
                          <Button
                            onClick={() => handleCancelBooking(booking.id, booking.timeSlot.id)}
                            disabled={cancelling === booking.id}
                            variant="outline"
                            size="sm"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 transition-colors"
                          >
                            {cancelling === booking.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Cancelando...
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar Reserva
                              </>
                            )}
                          </Button>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Reservado: {format(new Date(booking.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
            // Filtrar elementos null
            .filter(Boolean)}
        </div>
      )}
    </div>
  );
}
