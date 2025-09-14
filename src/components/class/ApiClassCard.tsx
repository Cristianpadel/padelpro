// src/components/class/ApiClassCard.tsx
"use client";

import React, { useMemo } from 'react';
import ClassCard from './ClassCard';
import { adaptApiDataForClassCard } from '@/lib/adapters/apiToClassCard';
import type { TimeSlot as ApiTimeSlot } from '@/lib/classesApi';
import type { User } from '@/types';

interface ApiClassCardProps {
    classData: ApiTimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    shareCode?: string;
    showPointsBonus?: boolean;
}

/**
 * Wrapper que convierte datos de la API para usar el ClassCard original
 */
const ApiClassCard: React.FC<ApiClassCardProps> = ({ 
    classData, 
    currentUser, 
    onBookingSuccess, 
    shareCode, 
    showPointsBonus = true 
}) => {
    // Convertir los datos de la API al formato que espera ClassCard
    const adaptedData = useMemo(() => {
        try {
            console.log('🔄 Adaptando datos para ClassCard original:', classData.id);
            return adaptApiDataForClassCard(classData);
        } catch (error) {
            console.error('❌ Error adaptando datos:', error);
            return null;
        }
    }, [classData]);

    if (!adaptedData) {
        console.error('❌ No se pudieron adaptar los datos para:', classData.id);
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">Error cargando la clase</p>
            </div>
        );
    }

    console.log('✅ Datos adaptados exitosamente:', {
        originalId: classData.id,
        adaptedId: adaptedData.timeSlot.id,
        instructor: adaptedData.instructor.name,
        club: adaptedData.club.name
    });

    return (
        <ClassCard
            classData={adaptedData.timeSlot}
            currentUser={currentUser}
            onBookingSuccess={onBookingSuccess}
            shareCode={shareCode}
            showPointsBonus={showPointsBonus}
        />
    );
};

export default ApiClassCard;