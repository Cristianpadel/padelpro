// src/components/class/ClassCard/ClassCardFooter.tsx
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TimeSlot, PadelCourt } from '@/types';
import { Lightbulb, Hash, Users2, Venus, Mars, HardHat } from 'lucide-react';

interface ClassCardFooterProps {
  currentSlot: TimeSlot;
  isSlotEffectivelyFull: boolean;
  courtAvailability: { available: PadelCourt[], occupied: PadelCourt[], total: number };
  onInfoClick: (type: 'level' | 'court' | 'category') => void;
}

const InfoButton = ({ icon: Icon, text, onClick }: { icon: React.ElementType, text: string, onClick: () => void }) => (
    <button onClick={onClick} className="flex-1">
        <Badge variant="outline" className="w-full justify-center text-xs py-1.5 rounded-full capitalize shadow-inner bg-slate-50 border-slate-200 hover:border-slate-300 transition-colors">
            <Icon className="mr-1.5 h-3 w-3" /> {text}
        </Badge>
    </button>
);


export const ClassCardFooter: React.FC<ClassCardFooterProps> = ({
    currentSlot,
    isSlotEffectivelyFull,
    courtAvailability,
    onInfoClick
}) => {
    
    const CategoryIcon = currentSlot.category === 'chica' ? Venus : currentSlot.category === 'chico' ? Mars : Users2;
    const levelDisplay = currentSlot.level === 'abierto'
        ? 'Nivel'
        : `${currentSlot.level.min}-${currentSlot.level.max}`;

    return (
        <div className="border-t pt-2 pb-3 px-3 space-y-2">
            <div className="flex justify-center items-center gap-1.5">
                <InfoButton icon={Lightbulb} text={levelDisplay} onClick={() => onInfoClick('level')} />
                <InfoButton icon={CategoryIcon} text="Categoría" onClick={() => onInfoClick('category')} />
                <InfoButton icon={Hash} text="Pista" onClick={() => onInfoClick('court')} />
            </div>
             <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <HardHat className="h-3.5 w-3.5" />
                <span>Pistas Disponibles en el Club para esta hora: </span>
                <span className="font-bold text-foreground">{courtAvailability.available.length}/{courtAvailability.total}</span>
            </div>
        </div>
    );
};
