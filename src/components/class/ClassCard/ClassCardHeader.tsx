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
import type { TimeSlot, Instructor, Club } from '@/types';
import { Clock, Share2, Star, Plus, Lightbulb, Hash, Users2, Venus, Mars } from 'lucide-react';
import { displayClassLevel, displayClassCategory } from '@/types';


interface ClassCardHeaderProps {
  currentSlot: TimeSlot;
  instructor: Instructor;
  clubInfo: Club | null;
  instructorRating: number;
  durationMinutes: number;
  isSlotEffectivelyFull: boolean;
  handleShareClass: () => void;
  onInfoClick: (type: 'level' | 'court' | 'category') => void;
  onReservarPrivadaClick: () => void;
  isProcessingPrivateAction: boolean;
  bookings: Record<number, { userId: string; groupSize: 1 | 2 | 3 | 4; }[]>;
  dayBlocked?: boolean;
}

const renderStarsDisplay = (rating: number) => {
  const fullStars = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={cn("h-4 w-4", i < fullStars ? "fill-amber-400 text-amber-500" : "fill-gray-300 text-gray-400")} />
  ));
  return <div className="flex items-center">{stars} <span className="ml-1.5 text-sm text-gray-600 font-medium">({rating.toFixed(1)})</span></div>;
};

const InfoButton = ({ icon: _Icon, text, onClick, className }: { icon: React.ElementType, text: string, onClick: () => void, className?: string }) => (
  <button className="flex-1" onClick={onClick}>
    <Badge variant="outline" className={cn("w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors", className)}>
      {text}
    </Badge>
  </button>
);


export const ClassCardHeader: React.FC<ClassCardHeaderProps> = ({
  currentSlot,
  instructor,
  clubInfo,
  instructorRating,
  durationMinutes,
  isSlotEffectivelyFull,
  handleShareClass,
  onInfoClick,
  onReservarPrivadaClick,
  isProcessingPrivateAction,
  bookings,
  dayBlocked
}) => {
  
  const canBookPrivate = (bookings[1] || []).length === 0 && (bookings[2] || []).length === 0 && (bookings[3] || []).length === 0 && (bookings[4] || []).length === 0;

  const isLevelAssigned = currentSlot.level !== 'abierto';
  const isCategoryAssigned = currentSlot.category !== 'abierta';
  const isCourtAssigned = !!currentSlot.courtNumber;

  const levelDisplay = isLevelAssigned
    ? (typeof currentSlot.level === 'object' ? `${currentSlot.level.min}-${currentSlot.level.max}` : String(currentSlot.level))
    : 'Nivel';
    
  const categoryDisplay = displayClassCategory(currentSlot.category, true);
  const courtDisplay = isCourtAssigned ? `Pista ${currentSlot.courtNumber}` : 'Pista';

  const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;
  
  const classifiedBadgeClass = 'text-blue-700 border-blue-200 bg-blue-100 hover:border-blue-300';

  return (
    <div className="pt-2 pb-1 px-3 space-y-2">
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
      disabled={isProcessingPrivateAction || dayBlocked}
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
        <InfoButton icon={Lightbulb} text={levelDisplay} onClick={() => onInfoClick('level')} className={cn(isLevelAssigned && classifiedBadgeClass)} />
        <InfoButton icon={CategoryIcon} text={categoryDisplay} onClick={() => onInfoClick('category')} className={cn(isCategoryAssigned && classifiedBadgeClass)} />
        <InfoButton icon={Hash} text={courtDisplay} onClick={() => onInfoClick('court')} className={cn(isCourtAssigned && classifiedBadgeClass)} />
      </div>

      {/* Middle section: Date, Time, Duration, and Share */}
       <div className="flex items-start justify-between border-t border-border pt-1.5">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 text-center font-bold bg-white p-1 rounded-md w-14 shadow-lg border border-border/20">
            <p className="text-xs uppercase text-muted-foreground">{format(new Date(currentSlot.startTime), "EEE", { locale: es })}</p>
            <p className="text-3xl leading-none">{format(new Date(currentSlot.startTime), "d")}</p>
            <p className="text-xs uppercase text-muted-foreground">{format(new Date(currentSlot.startTime), "MMM", { locale: es })}</p>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg">{format(new Date(currentSlot.startTime), 'HH:mm')}h</span>
            <span className="text-sm text-muted-foreground flex items-center"><Clock className="mr-1 h-3.5 w-3.5"/>{durationMinutes} min</span>
            <span className="text-sm text-muted-foreground">{clubInfo?.name || 'Club Padel'}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <Button variant="ghost" className="h-auto p-1 text-muted-foreground self-start" onClick={handleShareClass}>
              <Share2 className="h-5 w-5" />
            </Button>
        </div>
      </div>
    </div>
  );
};
