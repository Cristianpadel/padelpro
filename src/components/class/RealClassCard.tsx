// src/components/class/RealClassCard.tsx
"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Target, Award, Calendar, User, TrendingUp, Euro } from 'lucide-react';

import type { TimeSlot, User } from '@/types';
import { cn } from '@/lib/utils';

interface RealClassCardProps {
    classData: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    showPointsBonus: boolean;
}

const RealClassCard: React.FC<RealClassCardProps> = ({ 
    classData, 
    currentUser, 
    onBookingSuccess, 
    showPointsBonus 
}) => {
    const { toast } = useToast();
    const [isBooking, setIsBooking] = useState(false);

    // Debug: ver qué datos estamos recibiendo
    console.log('ClassData received:', {
        id: classData.id,
        start: classData.start,
        end: classData.end,
        instructorName: classData.instructorName,
        startType: typeof classData.start,
        endType: typeof classData.end
    });

    // Formatear hora - con validación
    let startTime = 'N/A';
    let endTime = 'N/A';
    
    try {
        if (classData.start) {
            const startDate = new Date(classData.start);
            if (!isNaN(startDate.getTime())) {
                startTime = format(startDate, 'HH:mm', { locale: es });
            } else {
                console.error('Invalid start date:', classData.start);
            }
        }
        
        if (classData.end) {
            const endDate = new Date(classData.end);
            if (!isNaN(endDate.getTime())) {
                endTime = format(endDate, 'HH:mm', { locale: es });
            } else {
                console.error('Invalid end date:', classData.end);
            }
        }
    } catch (error) {
        console.error('Error al formatear fechas:', error, { start: classData.start, end: classData.end });
    }

    const handleBooking = async () => {
        // Para desarrollo, usar un usuario de prueba si no hay currentUser
        const userId = currentUser?.id || 'user-alex-test'; // ID del usuario de prueba
        
        console.log('🔍 DEBUG: Iniciando reserva...', { 
            classId: classData.id, 
            userId, 
            currentUser: currentUser?.id 
        });
        
        if (!userId) {
            console.error('❌ DEBUG: Sin userId');
            toast({
                title: "Error",
                description: "No se pudo identificar el usuario",
                variant: "destructive",
            });
            return;
        }

        setIsBooking(true);
        
        try {
            console.log('📡 DEBUG: Enviando solicitud...', {
                url: '/api/classes/book',
                timeSlotId: classData.id,
                userId: userId
            });
            
            // Llamada a API para reservar
            const response = await fetch('/api/classes/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timeSlotId: classData.id,
                    userId: userId,
                }),
            });

            console.log('📡 DEBUG: Respuesta recibida', { 
                status: response.status, 
                ok: response.ok 
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('❌ DEBUG: Error del servidor:', errorData);
                throw new Error(errorData.message || 'Error al reservar la clase');
            }

            const result = await response.json();
            console.log('✅ DEBUG: Reserva exitosa:', result);
            
            toast({
                title: "¡Reserva exitosa!",
                description: `Has reservado la clase de ${classData.instructorName} para las ${startTime}`,
            });

            // Llamar onBookingSuccess para actualizar la lista
            if (onBookingSuccess) {
                onBookingSuccess();
            }
        } catch (error) {
            console.error('💥 DEBUG: Error capturado:', error);
            toast({
                title: "Error al reservar",
                description: error instanceof Error ? error.message : "Ocurrió un error inesperado",
                variant: "destructive",
            });
        } finally {
            setIsBooking(false);
        }
    };

    // Determinar el color de la categoría
    const getCategoryColor = (category: string) => {
        const colors: Record<string, string> = {
            'Femenino': 'bg-pink-100 text-pink-800 border-pink-200',
            'Masculino': 'bg-blue-100 text-blue-800 border-blue-200',
            'Mixto': 'bg-purple-100 text-purple-800 border-purple-200',
            'Infantil': 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Determinar el color del nivel
    const getLevelColor = (level: string) => {
        const colors: Record<string, string> = {
            'Principiante': 'bg-green-500',
            'Intermedio': 'bg-yellow-500',
            'Avanzado': 'bg-orange-500',
            'Competición': 'bg-red-500',
        };
        return colors[level] || 'bg-gray-500';
    };

    return (
        <Card className="w-full h-full overflow-hidden border-0 shadow-sm bg-white hover:shadow-md transition-shadow duration-200">
            {/* Header con horario e instructor */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold text-sm">
                            {startTime} - {endTime}
                        </span>
                    </div>
                    <Badge variant="secondary" className="bg-white/20 text-white text-xs">
                        30 min
                    </Badge>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium truncate">
                        {classData.instructorName || 'Instructor no asignado'}
                    </span>
                </div>
            </div>

            {/* Contenido principal */}
            <div className="p-4 space-y-3">
                {/* Nivel y Categoría */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <div 
                            className={cn(
                                "w-3 h-3 rounded-full",
                                getLevelColor(classData.level)
                            )}
                        />
                        <span className="text-sm font-medium text-gray-700">
                            {classData.level}
                        </span>
                    </div>
                    
                    <Badge 
                        variant="outline" 
                        className={cn("text-xs", getCategoryColor(classData.category))}
                    >
                        {classData.category}
                    </Badge>
                </div>

                {/* Cancha */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                        Cancha {classData.courtId}
                    </span>
                </div>

                {/* Precio */}
                <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-lg text-green-600">
                        {classData.price}€
                    </span>
                    <span className="text-sm text-gray-500">por persona</span>
                </div>

                {/* Disponibilidad */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                            Disponibilidad
                        </span>
                    </div>
                    <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm font-medium text-green-600">
                            {classData.availableSpots} lugares libres
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer con botón de reserva */}
            <div className="px-4 pb-4">
                <Button
                    onClick={handleBooking}
                    disabled={isBooking || classData.availableSpots === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    size="sm"
                >
                    {isBooking ? (
                        <div className="flex items-center space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>Reservando...</span>
                        </div>
                    ) : classData.availableSpots === 0 ? (
                        'Completo'
                    ) : (
                        `Reservar plaza (${classData.price}€)`
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default RealClassCard;
