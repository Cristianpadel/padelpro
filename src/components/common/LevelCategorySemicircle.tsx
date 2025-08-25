"use client";

import React from 'react';
import type { Club, MatchPadelLevel, PadelCategoryForSlot } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type Props = {
  level: MatchPadelLevel | undefined;
  category: PadelCategoryForSlot | undefined;
  club?: Club | null;
  size?: number; // px
  className?: string;
};

// Map category to a distinct color
const categoryColorMap: Record<PadelCategoryForSlot, string> = {
  abierta: '#64748b', // slate-500
  chico: '#2563eb',   // blue-600
  chica: '#ec4899',   // pink-500
};

function getLevelColor(level: MatchPadelLevel | undefined, club?: Club | null): string {
  if (!level || level === 'abierto') return '#94a3b8'; // slate-400
  const numeric = parseFloat(level as string);
  if (isNaN(numeric)) return '#0ea5e9'; // cyan-500 fallback
  const ranges = club?.levelRanges || [];
  const found = ranges.find(r => numeric >= parseFloat(r.min) && numeric <= parseFloat(r.max));
  if (found?.color) return found.color;
  return '#0ea5e9';
}

export const LevelCategorySemicircle: React.FC<Props> = ({ level, category, club, size = 18, className }) => {
  const lvlColor = getLevelColor(level, club);
  const catColor = category ? categoryColorMap[category] : categoryColorMap['abierta'];
  const dimension = Math.max(12, size);
  const border = Math.max(2, Math.floor(dimension * 0.11));

  const ringStyle: React.CSSProperties = {
    width: dimension,
    height: dimension,
    borderRadius: '50%',
    backgroundImage: `conic-gradient(${lvlColor} 0deg 180deg, ${catColor} 180deg 360deg)`,
    position: 'relative',
    boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)',
  };

  const innerStyle: React.CSSProperties = {
    position: 'absolute',
    top: border,
    left: border,
    right: border,
    bottom: border,
    borderRadius: '50%',
    background: 'white',
  };

  const title = `Nivel: ${level ?? 'abierto'} | Categoría: ${category ?? 'abierta'}`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={className} title={title} aria-label={title} style={{ display: 'inline-flex' }}>
            <div style={ringStyle}>
              <div style={innerStyle} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">{title}</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default LevelCategorySemicircle;
