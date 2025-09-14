// src/components/class/DatabaseClassCard.tsx
"use client";

import React, { useState, useMemo } from 'react';
import { format, differenceInMinutes } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { TimeSlot, User } from '@/types';
import { 
  Clock, 
  User as UserIcon, 
  Users2, 
  MapPin, 
  Euro, 
  Star,
  Calendar,
  Target,
  Venus,
  Mars
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseClassCardProps {
    classData: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    showPointsBonus: boolean;
}

const DatabaseClassCard: React.FC<DatabaseClassCardProps> = ({ 
  classData, 
  currentUser, 
  onBookingSuccess, 
  showPointsBonus 
}) => {
    const { toast } = useToast();
    const router = useRouter();
    
    const [isBooking, setIsBooking] = useState(false);

    // Datos calculados
    const startTime = new Date(classData.startTime);
    const endTime = new Date(classData.endTime);
    const durationMinutes = differenceInMinutes(endTime, startTime);
    
    // Mapeo de niveles
    const levelMapping = {
      'abierto': { label: 'Abierto', color: 'bg-green-100 text-green-800 border-green-200' },
      'principiante': { label: 'Principiante', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'intermedio': { label: 'Intermedio', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      'avanzado': { label: 'Avanzado', color: 'bg-red-100 text-red-800 border-red-200' }
    };

    // Mapeo de categorías
    const categoryMapping = {
      'abierta': { label: 'Mixto', icon: Users2, color: 'text-purple-600' },
      'chica': { label: 'Femenino', icon: Venus, color: 'text-pink-600' },
      'chico': { label: 'Masculino', icon: Mars, color: 'text-blue-600' },
      'mixto': { label: 'Mixto', icon: Users2, color: 'text-purple-600' }
    };

    const levelInfo = levelMapping[classData.level] || levelMapping['abierto'];
    const categoryInfo = categoryMapping[classData.category as keyof typeof categoryMapping] || categoryMapping['abierta'];
    const CategoryIcon = categoryInfo.icon;

    const spotsAvailable = classData.maxPlayers - classData.bookedPlayers.length;
    const isFullyBooked = spotsAvailable <= 0;

    const handleBooking = async () => {
        if (!currentUser) {
            toast({
                title: "Iniciar sesión requerido",
                description: "Debes iniciar sesión para reservar una clase.",
                variant: "destructive"
            });
            return;
        }

        setIsBooking(true);
        try {
            // Simular llamada a la API de reserva
            const response = await fetch('/api/classes/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    timeSlotId: classData.id,
                    userId: currentUser.id,
                    groupSize: 1
                }),
            });

            const data = await response.json();

            if (response.ok) {
                toast({
                    title: "¡Reserva exitosa!",
                    description: "Te has inscrito correctamente en la clase.",
                    className: "bg-green-600 text-white"
                });
                onBookingSuccess();
            } else {
                throw new Error(data.error || 'Error al reservar');
            }
        } catch (error) {
            toast({
                title: "Error al reservar",
                description: error instanceof Error ? error.message : 'Error desconocido',
                variant: "destructive"
            });
        } finally {
            setIsBooking(false);
        }
    };

    return (
        <Card className="flex flex-col h-full overflow-hidden border-2 hover:shadow-lg transition-shadow duration-200">
            {/* Header con horario */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">
                            {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                        </span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                        {durationMinutes} min
                    </Badge>
                </div>
                
                <div className="flex items-center space-x-2">
                    <UserIcon className="h-4 w-4 opacity-80" />
                    <span className="text-sm opacity-90">
                        {classData.instructorName || 'Instructor no asignado'}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 space-y-3">
                {/* Nivel y Categoría */}
                <div className="flex items-center justify-between">
                    <Badge className={cn("border", levelInfo.color)}>
                        <Target className="h-3 w-3 mr-1" />
                        {levelInfo.label}
                    </Badge>
                    <div className={cn("flex items-center space-x-1 text-sm font-medium", categoryInfo.color)}>
                        <CategoryIcon className="h-4 w-4" />
                        <span>{categoryInfo.label}</span>
                    </div>
                </div>

                {/* Precio */}
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Euro className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Precio total</span>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                        {classData.totalPrice?.toFixed(2) || '35.00'}€
                    </span>
                </div>

                {/* Disponibilidad */}
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                        <Users2 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Disponibilidad</span>
                    </div>
                    <div className="text-right">
                        <span className={cn(
                            "text-sm font-bold",
                            spotsAvailable > 2 ? "text-green-600" :
                            spotsAvailable > 0 ? "text-yellow-600" : "text-red-600"
                        )}>
                            {spotsAvailable} lugares libres
                        </span>
                        <div className="text-xs text-gray-500">
                            {classData.bookedPlayers.length} / {classData.maxPlayers} ocupados
                        </div>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>ID: {classData.id.substring(0, 8)}...</span>
                    </div>
                    {classData.courtNumber && (
                        <div className="flex items-center space-x-1">
                            <MapPin className="h-3 w-3" />
                            <span>Pista {classData.courtNumber}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer con botón de reserva */}
            <div className="p-4 bg-gray-50 border-t">
                <Button
                    onClick={handleBooking}
                    disabled={isFullyBooked || isBooking}
                    className={cn(
                        "w-full font-semibold transition-all duration-200",
                        isFullyBooked 
                            ? "bg-gray-400 cursor-not-allowed" 
                            : "bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
                    )}
                >
                    {isBooking ? (
                        <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            <span>Reservando...</span>
                        </div>
                    ) : isFullyBooked ? (
                        "Clase completa"
                    ) : (
                        `Reservar plaza (${classData.totalPrice?.toFixed(2) || '35.00'}€)`
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default DatabaseClassCard;
