"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface PlayerAvatarProps {
  player?: { userId: string, name?: string };
  currentUser?: User | null;
  size?: 'small' | 'medium' | 'large';
}

const PlayerAvatar: React.FC<PlayerAvatarProps> = ({ player, currentUser, size = 'medium' }) => {
  if (!player) {
    return null; // Or a placeholder for an empty spot
  }

  const isCurrentUser = currentUser?.id === player.userId;
  const playerName = player.name || `Jugador ${player.userId.slice(-4)}`;

  const sizeClasses = {
    small: 'h-8 w-8 text-xs',
    medium: 'h-10 w-10 text-sm',
    large: 'h-12 w-12 text-base',
  };

  return (
    <Avatar className={cn(
      "border-2",
      isCurrentUser ? "border-primary" : "border-muted",
      sizeClasses[size]
    )}>
      <AvatarImage 
        src={`https://i.pravatar.cc/48?u=${player.userId}`} 
        alt={playerName}
        data-ai-hint="player avatar"
      />
      <AvatarFallback>{getInitials(playerName)}</AvatarFallback>
    </Avatar>
  );
};

export default PlayerAvatar;
