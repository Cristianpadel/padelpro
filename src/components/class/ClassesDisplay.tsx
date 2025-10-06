import React, { useState, useEffect } from 'react';
import { ClassesApi, TimeSlot as ApiTimeSlot } from '@/lib/classesApi';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import SimpleApiClassCard from './SimpleApiClassCard';
import ClassCardPremium from './ClassCardPremium';
import ClassCardReal from './ClassCardReal'; // Usar ClassCardReal con funcionalidad simplificada
import type { User, TimeSlot } from '@/types';

interface ClassesDisplayProps {
  selectedDate: Date;
  clubId?: string;
  currentUser?: User | null;
  onBookingSuccess?: () => void;
}

export function ClassesDisplay({ selectedDate, clubId = 'club-1', currentUser, onBookingSuccess }: ClassesDisplayProps) {
  const [timeSlots, setTimeSlots] = useState<ApiTimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [designMode, setDesignMode] = useState<'original' | 'premium' | 'simple'>('original');

  useEffect(() => {
    loadTimeSlots();
  }, [selectedDate, clubId]);

  const loadTimeSlots = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      console.log('🔍 Loading slots for date:', dateString);
      
      let slots = await ClassesApi.getTimeSlots({
        clubId,
        date: dateString
      });
      
      console.log('📥 API returned slots:', slots.length);
      console.log('📝 First few slots:', slots.slice(0, 3));
      
      setTimeSlots(slots);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando clases');
      console.error('Error loading time slots:', err);
    } finally {
      setLoading(false);
    }
  };

  // Convertir API TimeSlot al formato que espera ClassCard original
  const convertApiSlotToClassCard = (apiSlot: ApiTimeSlot): TimeSlot => {
    return {
      id: apiSlot.id,
      clubId: apiSlot.clubId,
      instructorId: apiSlot.instructorId || `instructor-${apiSlot.id.substring(0, 8)}`,
      instructorName: apiSlot.instructorName || 'Instructor',
      instructorProfilePicture: apiSlot.instructorProfilePicture,
      startTime: new Date(apiSlot.start),
      endTime: new Date(apiSlot.end),
      durationMinutes: 90,
      level: 'abierto' as const, // Simplificado por ahora
      category: 'abierta' as const, // Simplificado por ahora
      maxPlayers: apiSlot.maxPlayers || 4,
      status: 'forming' as const,
      bookedPlayers: [], // Las reservas reales se manejan por API
      courtNumber: apiSlot.courtNumber,
      totalPrice: apiSlot.totalPrice,
      designatedGratisSpotPlaceholderIndexForOption: undefined,
      privateShareCode: undefined,
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando clases...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">Error: {error}</p>
        <button 
          onClick={loadTimeSlots}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>No hay clases disponibles para {format(selectedDate, 'dd/MM/yyyy', { locale: es })}</p>
        <p className="text-sm mt-2">Las clases de la base de datos pueden estar en fechas diferentes al día seleccionado.</p>
      </div>
    );
  }

  // Procesar las clases de la API
  const processedSlots = timeSlots.map((apiSlot) => {
    try {
      // Para el diseño original, convertir a TimeSlot
      const timeSlotFormat = convertApiSlotToClassCard(apiSlot);
      
      // Para otros diseños, mantener formato simple
      const maxPlayers = apiSlot.maxPlayers || 4;
      const bookedPlayers = apiSlot.bookedPlayers || 0;
      const availableSpots = maxPlayers - bookedPlayers;
      
      const simpleFormat = {
        ...apiSlot,
        availableSpots,
        price: apiSlot.totalPrice ? (apiSlot.totalPrice / maxPlayers) : 8.75
      };
      
      return { timeSlotFormat, simpleFormat };
    } catch (error) {
      console.error(`❌ Error procesando slot ${apiSlot.id}:`, error);
      return null;
    }
  }).filter((slot): slot is NonNullable<typeof slot> => slot !== null);

  console.log(`🎯 Processed ${processedSlots.length} slots successfully`);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-blue-700 mb-1">
            Sistema de Clases - Integración Directa con Base de Datos
          </h3>
          <p className="text-sm text-blue-600">
            ClassCard original conectado directamente a APIs reales (sin adaptadores)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setDesignMode('original')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                designMode === 'original' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Original
            </button>
            <button
              onClick={() => setDesignMode('premium')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                designMode === 'premium' 
                  ? 'bg-purple-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Premium
            </button>
            <button
              onClick={() => setDesignMode('simple')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                designMode === 'simple' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Simple
            </button>
          </div>
          <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
            {timeSlots.length} clases encontradas → {processedSlots.length} tarjetas
          </span>
        </div>
      </div>

      {/* Debug Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h4 className="font-semibold text-yellow-800 mb-2">🔍 Información del Sistema</h4>
        <div className="text-sm text-yellow-700 space-y-1">
          <p><strong>API Slots:</strong> {timeSlots.length}</p>
          <p><strong>Processed Slots:</strong> {processedSlots.length}</p>
          <p><strong>Selected Date:</strong> {format(selectedDate, 'yyyy-MM-dd')}</p>
          <p><strong>Fecha seleccionada:</strong> {format(selectedDate, 'dd/MM/yyyy', { locale: es })}</p>
          {timeSlots.length > 0 && (
            <p><strong>Primera clase:</strong> {timeSlots[0]?.id} - {timeSlots[0]?.instructorName}</p>
          )}
        </div>
      </div>

      {/* Grid responsivo */}
      <div className="w-full">
        {designMode === 'original' ? (
          /* Diseño Original - ClassCard completo */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedSlots.map((slot) => (
              <div key={slot.timeSlotFormat.id} className="flex justify-center">
                <ClassCardReal
                  classData={slot.timeSlotFormat}
                  currentUser={currentUser || null}
                  onBookingSuccess={() => {
                    loadTimeSlots(); // Recargar datos después de una reserva
                    onBookingSuccess?.();
                  }}
                  showPointsBonus={true}
                />
              </div>
            ))}
          </div>
        ) : designMode === 'premium' ? (
          /* Diseño Premium - Grid de tarjetas */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {processedSlots.map((slot) => (
              <div key={slot.simpleFormat.id} className="flex justify-center">
                <ClassCardPremium
                  classData={slot.simpleFormat}
                  currentUser={currentUser || null}
                  onBookingSuccess={() => {
                    loadTimeSlots(); // Recargar datos después de una reserva
                    onBookingSuccess?.();
                  }}
                />
              </div>
            ))}
          </div>
        ) : (
          /* Diseño Simple */
          <>
            {/* Móvil: Stack vertical */}
            <div className="md:hidden space-y-4 max-w-[350px] mx-auto">
              {processedSlots.map((slot) => (
                <div key={slot.simpleFormat.id} className="w-full">
                  <SimpleApiClassCard
                    classData={slot.simpleFormat}
                    currentUser={currentUser || null}
                    onBookingSuccess={() => {
                      loadTimeSlots(); // Recargar datos después de una reserva
                      onBookingSuccess?.();
                    }}
                  />
                </div>
              ))}
            </div>
            
            {/* Desktop: Flex wrap optimizado para alta densidad */}
            <div className="hidden md:flex flex-wrap gap-2">
              {processedSlots.map((slot) => (
                <div key={slot.simpleFormat.id} className="flex-none w-[300px]">
                  <SimpleApiClassCard
                    classData={slot.simpleFormat}
                    currentUser={currentUser || null}
                    onBookingSuccess={() => {
                      loadTimeSlots(); // Recargar datos después de una reserva
                      onBookingSuccess?.();
                    }}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
