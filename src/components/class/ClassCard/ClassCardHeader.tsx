"use client";

import React from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TimeSlot, Instructor, Club } from '@/types';
import { Clock, Share2, Star, CircleCheckBig, BarChartHorizontal, Hash, Users2 as CategoryIcon, Venus, Mars } from 'lucide-react';
import { displayClassLevel, displayClassCategory } from '@/types';

interface ClassCardHeaderProps {
  currentSlot: TimeSlot;
  instructor: Instructor;
  clubInfo: Club;
  instructorRating: number;
  durationMinutes: number;
  isSlotEffectivelyFull: boolean;
  handleShareClass: () => void;
  handleInfoClick: (type: 'level' | 'court' | 'category') => void;
}

const renderStarsDisplay = (rating: number) => {
  const fullStars = Math.round(rating);
  const stars = Array.from({ length: 5 }, (_, i) => (
    <Star key={i} className={cn("h-4 w-4", i < fullStars ? "fill-amber-500 text-amber-500" : "fill-gray-300 text-gray-400")} />
  ));
  return <div className="flex items-center">{stars} <span className="ml-1.5 text-sm text-gray-600 font-medium">({rating.toFixed(1)})</span></div>;
};

export const ClassCardHeader: React.FC<ClassCardHeaderProps> = ({
  currentSlot,
  instructor,
  clubInfo,
  instructorRating,
  durationMinutes,
  isSlotEffectivelyFull,
  handleShareClass,
  handleInfoClick
}) => {
  const TheCategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : CategoryIcon;

  const badges = [
    { type: 'category', value: displayClassCategory(currentSlot.category), icon: TheCategoryIcon },
    { type: 'court', value: currentSlot.courtNumber ? `Pista ${currentSlot.courtNumber}` : 'Pista', icon: Hash },
    { type: 'level', value: currentSlot.level === 'abierto' ? 'Nivel' : displayClassLevel(currentSlot.level), icon: BarChartHorizontal }
  ];

  return (
    <div className="pt-3 pb-2 px-3 space-y-2">
      <div className="flex justify-between items-start">
        <Link href={`/instructors/${currentSlot.instructorId}`} passHref className="group flex-grow">
          <div className="flex items-center space-x-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={instructor?.profilePictureUrl || `https://avatar.vercel.sh/${currentSlot.instructorId || currentSlot.instructorName.replace(/\s+/g, '')}.png?size=60`} alt={currentSlot.instructorName} data-ai-hint="instructor avatar large"/>
              <AvatarFallback className="text-xl">{getInitials(currentSlot.instructorName)}</AvatarFallback>
            </Avatar>
            <div className="flex-grow">
              <p className="font-semibold text-lg text-gray-800 -mb-0.5 group-hover:underline">{currentSlot.instructorName}</p>
              {renderStarsDisplay(instructorRating)}
            </div>
          </div>
        </Link>
        {isSlotEffectivelyFull && (
          <Badge variant="default" className="text-xs bg-green-600 text-white border-green-700">
            <CircleCheckBig className="mr-1 h-3 w-3" /> Completa
          </Badge>
        )}
      </div>

      <div className="flex justify-between items-center border-t border-border pt-2">
        <div className="flex items-start space-x-3">
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

      <div className="flex justify-center items-center gap-1.5 pb-2">
        {badges.map(item => (
          <button key={item.type} onClick={() => handleInfoClick(item.type as any)} className="flex-1">
            <Badge variant="outline" className="w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200">
              <item.icon className="mr-1.5 h-3 w-3" />
              {item.value}
            </Badge>
          </button>
        ))}
      </div>
    </div>
  );
};
