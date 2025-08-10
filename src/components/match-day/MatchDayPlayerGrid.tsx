// src/components/match-day/MatchDayPlayerGrid.tsx
"use client";

import React from 'react';
import type { MatchDayEvent, MatchDayInscription, User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getInitials } from '@/lib/utils';
import { UserPlus, PlusCircle, CheckCircle, Hourglass, Handshake } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                        {Array.from({ length: event.maxPlayers }).map((_, index) => {
                            const inscription = mainList[index];
                            if (inscription) {
                                const isCurrentUser = inscription.userId === currentUser?.id;
                                const isPreferredPartner = userPreferredPartnerId === inscription.userId;
                                return (
                                    <div 
                                      key={inscription.id} 
                                      className={cn(
                                        "p-3 border rounded-lg flex flex-col items-center justify-between text-center bg-background shadow-sm transition-all h-40",
                                        isCurrentUser && "bg-blue-50 border-blue-300 ring-2 ring-blue-400",
                                        isPreferredPartner && "bg-purple-50 border-purple-300 ring-2 ring-purple-400"
                                      )}
                                    >
                                        <div className="flex flex-col items-center gap-1 overflow-hidden">
                                            <Avatar className={cn(
                                                "h-16 w-16 p-0 overflow-hidden shadow-[inset_0_3px_6px_0_rgba(0,0,0,0.4)]",
                                                isCurrentUser ? "border-[3px] border-primary shadow-lg" : "border-gray-300"
                                            )}>
                                                <AvatarImage src={inscription.userProfilePictureUrl} data-ai-hint="player avatar"/>
                                                <AvatarFallback className="text-xl">{getInitials(inscription.userName)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 overflow-hidden mt-1">
                                                <p className="font-medium text-sm truncate">{inscription.userName}</p>
                                                <Badge variant="outline" className="text-xs">N: {inscription.userLevel}</Badge>
                                            </div>
                                        </div>
                                        {!isCurrentUser && userInscription && (
                                            <Button 
                                                size="xs" 
                                                variant={isPreferredPartner ? "default" : "secondary"}
                                                onClick={() => onSelectPartner(inscription.userId)}
                                                className={cn("h-7 text-xs w-full mt-1", isPreferredPartner && "bg-purple-600 hover:bg-purple-700")}
                                            >
                                                {isPreferredPartner ? <CheckCircle className="h-4 w-4"/> : <Handshake className="h-4 w-4"/>}
                                            </Button>
                                        )}
                                    </div>
                                );
                            }
                            // Render empty slot
                            return (
                                <div key={`empty-${index}`} className="p-3 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-secondary/30 h-40">
                                     <div className="relative inline-flex items-center justify-center h-16 w-16 rounded-full border-[3px] border-dashed border-gray-400 bg-white/50 shadow-inner">
                                        <UserPlus className="h-8 w-8" />
                                    </div>
                                    <p className="text-xs font-medium mt-2">Plaza Libre</p>
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
