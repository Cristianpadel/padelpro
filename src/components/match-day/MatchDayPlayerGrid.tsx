// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React from 'react';
import type { MatchDayEvent, MatchDayInscription, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, PlusCircle, CheckCircle, Hourglass } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MatchDayPlayerGridProps {
    event: MatchDayEvent;
    inscriptions: MatchDayInscription[];
    currentUser: User | null;
    onSelectPartner: (partnerId: string) => void;
}

const MatchDayPlayerGrid: React.FC<MatchDayPlayerGridProps> = ({ event, inscriptions, currentUser, onSelectPartner }) => {
    const mainList = inscriptions.filter(i => i.status === 'main');
    const reserveList = inscriptions.filter(i => i.status === 'reserve');
    const userInscription = inscriptions.find(i => i.userId === currentUser?.id);
    const userPreferredPartnerId = userInscription?.preferredPartnerId;

    return (
        <Card>
            <CardHeader>
                <CardTitle>Jugadores Inscritos</CardTitle>
                <CardDescription>Aquí puedes ver quién se ha apuntado y elegir tu pareja preferida para el sorteo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <h4 className="font-semibold mb-3">Lista Principal ({mainList.length} / {event.maxPlayers})</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Array.from({ length: event.maxPlayers }).map((_, index) => {
                            const inscription = mainList[index];
                            if (inscription) {
                                const isCurrentUser = inscription.userId === currentUser?.id;
                                const isPreferredPartner = userPreferredPartnerId === inscription.userId;
                                return (
                                    <div key={inscription.id} className="p-3 border rounded-lg flex items-center justify-between bg-background shadow-sm">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                                <AvatarFallback>{getInitials(inscription.userName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden">
                                                <p className="font-medium text-sm truncate">{inscription.userName}</p>
                                                <Badge variant="outline" className="text-xs">N: {inscription.userLevel}</Badge>
                                            </div>
                                        </div>
                                        {!isCurrentUser && userInscription && (
                                            <Button 
                                                size="sm" 
                                                variant={isPreferredPartner ? "default" : "secondary"}
                                                onClick={() => onSelectPartner(inscription.userId)}
                                                className="h-8 text-xs"
                                            >
                                                {isPreferredPartner ? <CheckCircle className="h-4 w-4"/> : <PlusCircle className="h-4 w-4"/>}
                                            </Button>
                                        )}
                                    </div>
                                );
                            }
                            // Render empty slot
                            return (
                                <div key={`empty-${index}`} className="p-3 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground bg-secondary/30">
                                    <UserPlus className="h-6 w-6" />
                                </div>
                            );
                        })}
                    </div>
                </div>

                {event.reservePlayers > 0 && (
                    <div>
                        <h4 className="font-semibold mb-2">Lista de Reserva ({reserveList.length} / {event.reservePlayers})</h4>
                        {reserveList.length > 0 ? (
                             <ScrollArea className="h-32 w-full">
                                <div className="space-y-2 pr-4">
                                {reserveList.map((inscription, index) => (
                                    <div key={inscription.id} className="p-2 border rounded-md flex items-center justify-between bg-muted/50">
                                         <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm w-6 text-center text-muted-foreground">{index + 1}.</span>
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
                        ) : (
                             <div className="p-4 border-2 border-dashed rounded-lg text-center text-muted-foreground">
                                <p>La lista de reserva está vacía.</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default MatchDayPlayerGrid;
