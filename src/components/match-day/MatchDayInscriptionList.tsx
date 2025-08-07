// src/components/match-day/MatchDayInscriptionList.tsx
"use client";

import React from 'react';
import type { MatchDayInscription } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MatchDayInscriptionListProps {
    inscriptions: MatchDayInscription[];
}

const MatchDayInscriptionList: React.FC<MatchDayInscriptionListProps> = ({ inscriptions }) => {
    const mainList = inscriptions.filter(i => i.status === 'main');
    const reserveList = inscriptions.filter(i => i.status === 'reserve');

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold text-lg mb-2">Lista Principal ({mainList.length})</h4>
                {mainList.length > 0 ? (
                    <ScrollArea className="h-48">
                        <div className="space-y-2 pr-4">
                            {mainList.map(inscription => (
                                <div key={inscription.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                            <AvatarFallback>{getInitials(inscription.userName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{inscription.userName}</span>
                                    </div>
                                    <Badge variant="outline">N: {inscription.userLevel}</Badge>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : <p className="text-sm text-muted-foreground italic">Nadie se ha apuntado aún.</p>}
            </div>

            {reserveList.length > 0 && (
                 <div>
                    <h4 className="font-semibold text-lg mb-2">Lista de Reserva ({reserveList.length})</h4>
                     <ScrollArea className="h-32">
                        <div className="space-y-2 pr-4">
                            {reserveList.map((inscription, index) => (
                                <div key={inscription.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded-md">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm w-6 text-center">{index + 1}.</span>
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                            <AvatarFallback>{getInitials(inscription.userName)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm">{inscription.userName}</span>
                                    </div>
                                    <Badge variant="outline">N: {inscription.userLevel}</Badge>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            )}
        </div>
    );
};

export default MatchDayInscriptionList;
