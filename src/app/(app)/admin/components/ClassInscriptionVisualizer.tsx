"use client";

import React from 'react';
import type { TimeSlot, User } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { getMockStudents } from '@/lib/mockData';
import { Users, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClassInscriptionVisualizerProps {
  timeSlot: TimeSlot;
}

const ClassInscriptionVisualizer: React.FC<ClassInscriptionVisualizerProps> = ({ timeSlot }) => {
  const bookedPlayers = timeSlot.bookedPlayers || [];
  const maxCapacity = timeSlot.maxPlayers || 4;
  const isPrivate = timeSlot.status === 'confirmed_private';
  const allStudents = getMockStudents();

  const getPlayerDetails = (userId: string) => {
    return allStudents.find(s => s.id === userId) || { id: userId, name: `ID: ${userId.slice(0, 4)}`, profilePictureUrl: '' };
  };

  if (bookedPlayers.length === 0) {
    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-1 text-blue-800 bg-blue-50/50">
            <UserIcon className="h-5 w-5 opacity-80" />
            <p className="text-[9px] font-semibold text-center mt-0.5">Propuesta</p>
        </div>
    );
  }

  return (
    <div className={cn("h-full w-full flex flex-col items-center justify-center p-1", isPrivate ? "bg-purple-800 text-white" : "bg-green-600 text-white")}>
       <p className="text-[10px] font-bold text-center leading-tight mb-0.5">{isPrivate ? `Privada (${timeSlot.confirmedPrivateSize}p)` : `Clase (${bookedPlayers.length}/${maxCapacity})`}</p>
      <div className="flex flex-wrap items-center justify-center -space-x-2">
        {bookedPlayers.map(player => {
          const student = getPlayerDetails(player.userId);
          return (
            <TooltipProvider key={player.userId} delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Avatar className="h-5 w-5 border-2 border-white dark:border-gray-800">
                    <AvatarImage src={student.profilePictureUrl} alt={student.name || 'avatar'} data-ai-hint="student avatar tiny"/>
                    <AvatarFallback className="text-[7px]">{getInitials(student.name || '')}</AvatarFallback>
                  </Avatar>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs p-1">
                  <p>{student.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
    </div>
  );
};

export default ClassInscriptionVisualizer;
