// src/components/match-day/MatchDayDrawSimulator.tsx
"use client";

import React from 'react';
import type { MatchDayInscription } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dices, Swords, Users, User, Heart, UserPlus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getInitials } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface MatchDayDrawSimulatorProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  matches: { player1: MatchDayInscription, player2: MatchDayInscription }[][];
}

const PlayerCard: React.FC<{player: MatchDayInscription}> = ({ player }) => {
    const isPlaceholder = player.userName === 'Plaza Libre';

    if (isPlaceholder) {
        return (
            <div className="flex flex-col items-center">
                <div className="relative inline-flex items-center justify-center h-12 w-12 rounded-full border-2 border-dashed border-gray-400 bg-white/50 shadow-inner">
                    <UserPlus className="h-6 w-6 text-gray-500" />
                </div>
                <p className="text-xs font-medium mt-1 text-muted-foreground">{player.userName}</p>
                 <Badge variant="outline" className="text-[10px] mt-0.5 invisible">N/A</Badge>
            </div>
        );
    }
    
    return (
        <div className="flex flex-col items-center">
            <Avatar className="h-12 w-12">
                <AvatarImage src={player.userProfilePictureUrl} />
                <AvatarFallback>{getInitials(player.userName)}</AvatarFallback>
            </Avatar>
            <p className="text-xs font-medium mt-1 truncate max-w-[80px]">{player.userName}</p>
            <Badge variant="outline" className="text-[10px] mt-0.5">N: {player.userLevel}</Badge>
        </div>
    );
}

const MatchDayDrawSimulator: React.FC<MatchDayDrawSimulatorProps> = ({
  isOpen,
  onOpenChange,
  matches,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Dices className="mr-2 h-5 w-5 text-primary" />
            Simulación del Sorteo Match-Day
          </DialogTitle>
          <DialogDescription>
            Este es un posible resultado del sorteo. Las parejas y partidas reales pueden variar.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] my-4 pr-4">
            <div className="space-y-4">
                {matches.map((matchPairs, matchIndex) => (
                    <div key={matchIndex} className="p-4 border rounded-lg bg-secondary/50">
                        <h3 className="font-semibold text-lg mb-3 flex items-center">
                            <Swords className="mr-2 h-5 w-5 text-secondary-foreground" />
                            Partida {matchIndex + 1}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {matchPairs.map((pair, pairIndex) => (
                                <div key={`${matchIndex}-${pairIndex}`} className="p-3 bg-background rounded-md shadow-sm border flex flex-col items-center justify-center">
                                    <div className="flex items-center gap-2">
                                        <PlayerCard player={pair.player1} />
                                        <Swords className="h-5 w-5 text-muted-foreground" />
                                        <PlayerCard player={pair.player2} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button">Cerrar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MatchDayDrawSimulator;
