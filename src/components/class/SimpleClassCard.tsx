// src/components/class/SimpleClassCard.tsx
"use client";

import React from 'react';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import type { TimeSlot, User } from '@/types';

interface SimpleClassCardProps {
    classData: TimeSlot;
    currentUser: User | null;
    onBookingSuccess: () => void;
    showPointsBonus: boolean;
}

const SimpleClassCard: React.FC<SimpleClassCardProps> = ({ classData, currentUser, onBookingSuccess, showPointsBonus }) => {
    const startTime = new Date(classData.startTime);
    const endTime = new Date(classData.endTime);
    
    return (
        <Card className="p-4 border-2 border-blue-300 bg-white shadow-md min-h-[200px]">
            <div className="space-y-2">
                <div className="bg-blue-100 p-2 rounded">
                    <h3 className="font-bold text-blue-800">DEBUG: Simple Class Card</h3>
                    <p className="text-xs text-blue-600">ID: {classData.id}</p>
                </div>
                
                <div className="bg-green-50 p-2 rounded">
                    <h4 className="font-semibold text-green-800">⏰ Horario</h4>
                    <p className="text-sm">
                        {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                    </p>
                    <p className="text-xs text-gray-600">
                        Duración: {classData.durationMinutes} min
                    </p>
                </div>

                <div className="bg-yellow-50 p-2 rounded">
                    <h4 className="font-semibold text-yellow-800">👨‍🏫 Instructor</h4>
                    <p className="text-sm">{classData.instructorName}</p>
                    <p className="text-xs text-gray-600">ID: {classData.instructorId}</p>
                </div>

                <div className="bg-purple-50 p-2 rounded">
                    <h4 className="font-semibold text-purple-800">🏓 Detalles</h4>
                    <p className="text-xs">Nivel: {classData.level}</p>
                    <p className="text-xs">Categoría: {classData.category}</p>
                    <p className="text-xs">Máx. jugadores: {classData.maxPlayers}</p>
                    <p className="text-xs">Precio: {classData.totalPrice}€</p>
                </div>

                <div className="bg-red-50 p-2 rounded">
                    <h4 className="font-semibold text-red-800">👥 Reservas</h4>
                    <p className="text-sm">
                        {classData.bookedPlayers.length} / {classData.maxPlayers} jugadores
                    </p>
                </div>

                <button 
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
                    onClick={() => {
                        console.log('🎯 Card clicked:', classData.id);
                        // onBookingSuccess();
                    }}
                >
                    🔍 Ver Detalles
                </button>
            </div>
        </Card>
    );
};

export default SimpleClassCard;
