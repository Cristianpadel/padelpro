// src/components/class/SimpleApiClassCard.tsx
"use client";

import React, { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Euro, User as UserIcon } from 'lucide-react';

import type { TimeSlot as ApiTimeSlot } from '@/lib/classesApi';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface SimpleApiClassCardProps {
    classData: ApiTimeSlot & { 
        availableSpots: number; 
        price: number; 
    };
    currentUser: User | null;
    onBookingSuccess: () => void;
}

const SimpleApiClassCard: React.FC<SimpleApiClassCardProps> = ({ 
    classData, 
    currentUser, 
    onBookingSuccess 
}) => {
    const { toast } = useToast();
    const [isBooking, setIsBooking] = useState(false);

    // Debug: ver qué datos estamos recibiendo
    console.log('🎯 SimpleApiClassCard data:', {
        id: classData.id,
        start: classData.start,
        end: classData.end,
        instructorName: classData.instructorName,
        totalPrice: classData.totalPrice,
        bookedPlayers: classData.bookedPlayers,
        maxPlayers: classData.maxPlayers,
        availableSpots: classData.availableSpots,
        price: classData.price
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
        // TEMPORAL: Forzar el uso del usuario de prueba que existe en la BD
        const userId = 'user-alex-test'; // Forzando el usuario que sabemos que existe
        
        console.log('🔍 DEBUG: Iniciando reserva...', { 
            classId: classData.id, 
            userId, 
            currentUser: currentUser?.id,
            currentUserFull: currentUser,
            note: 'Forzando user-alex-test para desarrollo'
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
    const getCategoryColor = (category: string | undefined) => {
        if (!category) return 'bg-gray-100 text-gray-800 border-gray-200';
        
        const colors: Record<string, string> = {
            'Femenino': 'bg-pink-100 text-pink-800 border-pink-200',
            'Masculino': 'bg-blue-100 text-blue-800 border-blue-200',
            'Mixto': 'bg-purple-100 text-purple-800 border-purple-200',
            'Infantil': 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[category] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Determinar el color del nivel
    const getLevelColor = (level: string | undefined) => {
        if (!level) return 'bg-gray-500';
        
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
                        90 min
                    </Badge>
                </div>
                
                <div className="flex items-center space-x-2 mt-2">
                    <UserIcon className="h-4 w-4" />
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
                            {classData.level || 'Abierto'}
                        </span>
                    </div>
                    
                    <Badge 
                        variant="outline" 
                        className={cn("text-xs", getCategoryColor(classData.category))}
                    >
                        {classData.category || 'Mixto'}
                    </Badge>
                </div>

                {/* Cancha */}
                <div className="flex items-center space-x-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">
                        Cancha {classData.courtNumber || 1}
                    </span>
                </div>

                {/* Precio */}
                <div className="flex items-center space-x-2">
                    <Euro className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-lg text-green-600">
                        {classData.price.toFixed(2)}€
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
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            classData.availableSpots > 0 ? "bg-green-500" : "bg-red-500"
                        )}></div>
                        <span className={cn(
                            "text-sm font-medium",
                            classData.availableSpots > 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {classData.availableSpots > 0 ? `${classData.availableSpots} lugares libres` : 'Completo'}
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
                        `Reservar plaza (${classData.price.toFixed(2)}€)`
                    )}
                </Button>
            </div>
        </Card>
    );
};

export default SimpleApiClassCard;
