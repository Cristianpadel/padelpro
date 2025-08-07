// src/components/class/ClassCard/ClassCardHeader.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TimeSlot, Instructor } from '@/types';
import { Clock, Share2, Star, Plus, Lightbulb, Hash, Users2, Venus, Mars } from 'lucide-react';
import { displayClassLevel, displayClassCategory } from '@/types';


interface ClassCardHeaderProps {
  currentSlot: TimeSlot;
  instructor: Instructor;
  instructorRating: number;
  durationMinutes: number;
  isSlotEffectivelyFull: boolean;
  handleShareClass: () => void;
  onInfoClick: (type: 'level' | 'court' | 'category') => void;
  onReservarPrivadaClick: () => void;
  isProcessingPrivateAction: boolean;
  bookings: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]>;
}

const renderStarsDisplay = (rating: number) => {
  const fullStars = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={cn("h-4 w-4", i < fullStars ? "fill-amber-400 text-amber-500" : "fill-gray-300 text-gray-400")} />
  ));
  return <div className="flex items-center">{stars} <span className="ml-1.5 text-sm text-gray-600 font-medium">({rating.toFixed(1)})</span></div>;
};

const InfoButton = ({ icon: Icon, text, onClick, className }: { icon: React.ElementType, text: string, onClick: () => void, className?: string }) => (
    <button onClick={onClick} className="flex-1">
        <Badge variant="outline" className={cn("w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors", className)}>
            <Icon className="mr-1.5 h-3 w-3" /> {text}
        </Badge>
    </button>
);


export const ClassCardHeader: React.FC<ClassCardHeaderProps> = ({
  currentSlot,
  instructor,
  instructorRating,
  durationMinutes,
  isSlotEffectivelyFull,
  handleShareClass,
  onInfoClick,
  onReservarPrivadaClick,
  isProcessingPrivateAction,
  bookings
}) => {
  
  const canBookPrivate = (bookings[1] || []).length === 0 && (bookings[2] || []).length === 0 && (bookings[3] || []).length === 0 && (bookings[4] || []).length === 0;

  const levelDisplay = currentSlot.level === 'abierto'
        ? 'Nivel'
        : (typeof currentSlot.level === 'object' ? `${currentSlot.level.min}-${currentSlot.level.max}` : String(currentSlot.level));
  
  const isLevelSelected = currentSlot.level !== 'abierto';


  const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;


  return (
    <div className="pt-2 pb-1 px-3 space-y-1">
      {/* Top section: Avatar, Name, Rating, and Private Button */}
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-3">
           <Link href={`/instructors/${currentSlot.instructorId}`} passHref className="group">
             <Avatar className="h-12 w-12">
                <AvatarImage src={instructor?.profilePictureUrl || `https://avatar.vercel.sh/${currentSlot.instructorId || currentSlot.instructorName.replace(/\s+/g, '')}.png?size=60`} alt={currentSlot.instructorName} data-ai-hint="instructor avatar large"/>
                <AvatarFallback className="text-xl">{getInitials(currentSlot.instructorName)}</AvatarFallback>
            </Avatar>
           </Link>
           <div className="flex flex-col">
              <Link href={`/instructors/${currentSlot.instructorId}`} passHref className="group">
                <p className="font-semibold text-lg text-gray-800 -mb-0.5 group-hover:underline">{currentSlot.instructorName}</p>
              </Link>
              {renderStarsDisplay(instructorRating)}
           </div>
        </div>
        {canBookPrivate && (
            <Button 
              size="sm" 
              className="bg-purple-600 text-white rounded-lg h-auto py-1 px-3 flex flex-col items-center leading-none shadow-md hover:bg-purple-700" 
              onClick={onReservarPrivadaClick}
              disabled={isProcessingPrivateAction}
            >
              <div className="flex items-center gap-1.5">
                 <Plus className="h-4 w-4"/>
                 <span className="font-bold">Reservar</span>
              </div>
              <span className="text-xs font-normal">Privada</span>
            </Button>
        )}
      </div>

       {/* Info Buttons Section */}
      <div className="flex justify-center items-center gap-1.5 pt-1">
          <InfoButton 
              icon={Lightbulb} 
              text={levelDisplay} 
              onClick={() => onInfoClick('level')}
              className={isLevelSelected ? 'text-blue-700 border-blue-200 bg-blue-100 hover:border-blue-300' : ''}
          />
          <InfoButton icon={CategoryIcon} text={displayClassCategory(currentSlot.category, true)} onClick={() => onInfoClick('category')} className={
              currentSlot.category === 'chica' ? 'text-pink-600 border-pink-200 bg-pink-50 hover:border-pink-300' :
              currentSlot.category === 'chico' ? 'text-blue-600 border-blue-200 bg-blue-50 hover:border-blue-300' : ''
          } />
          <InfoButton icon={Hash} text={currentSlot.courtNumber ? `Pista ${currentSlot.courtNumber}` : 'Pista'} onClick={() => onInfoClick('court')} />
      </div>

      {/* Middle section: Date, Time, Duration, and Share */}
      <div className="flex justify-between items-center border-t border-border pt-1">
        <div className="flex items-center space-x-3">
          <div className="flex flex-col items-center justify-center font-bold">
            <span className="text-4xl leading-none -mb-1">{format(new Date(currentSlot.startTime), 'd')}</span>
            <span className="text-[10px] uppercase leading-none">{format(new Date(currentSlot.startTime), 'MMM', { locale: es })}</span>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-foreground uppercase">{format(new Date(currentSlot.startTime), 'eeee HH:mm\'h\'', { locale: es })}</p>
            <p className="text-xs text-muted-foreground flex items-center">
              <Clock className="mr-1 h-3 w-3" /> {durationMinutes} min
            </p>
          </div>
        </div>
        <Button variant="ghost" className="h-auto p-1 text-muted-foreground self-start" onClick={handleShareClass}>
          <Share2 className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
