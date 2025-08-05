"use client";

import React from 'react';
import type { Match, User } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, BarChartHorizontal, Trash2, UserX, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { getInitials } from '@/lib/utils';


interface MatchAdminCardProps {
    match: Match;
    currentAdminClubId: string;
    onCancelMatch: (matchId: string) => void;
    onRemovePlayer: (matchId: string, playerId: string) => void;
    isProcessingActionForMatch: (type: 'cancelMatch' | 'removePlayer', entityId: string) => boolean;
}

const MatchAdminCard: React.FC<MatchAdminCardProps> = ({ match, onCancelMatch, onRemovePlayer, isProcessingActionForMatch }) => {
    const TOTAL_SLOTS = 4;
    const isCancelProcessing = isProcessingActionForMatch('cancelMatch', match.id);

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg">Partida en Pista {match.courtNumber}</CardTitle>
                        <CardDescription className="text-xs">
                            {format(new Date(match.startTime), "d MMM, HH:mm", { locale: es })} - {format(new Date(match.endTime), "HH:mm", { locale: es })}
                        </CardDescription>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={isCancelProcessing}>
                                {isCancelProcessing ? <Loader2 className="h-4 w-4 animate-spin"/> : 'Cancelar'}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Confirmar cancelación?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción cancelará la partida para todos los jugadores. Se les notificará y, si aplica, se les devolverá el dinero (simulado). Esta acción no se puede deshacer.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>No</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onCancelMatch(match.id)} className="bg-destructive hover:bg-destructive/90">Sí, Cancelar Partida</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                 <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <Badge variant="outline" className="flex items-center gap-1"><BarChartHorizontal className="h-3.5 w-3.5"/> Nivel {match.level}</Badge>
                    <Badge variant="secondary">{match.category}</Badge>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
                 <h4 className="font-semibold text-sm mb-2">Jugadores ({match.bookedPlayers.length}/{TOTAL_SLOTS})</h4>
                 <div className="grid grid-cols-2 gap-2">
                    {match.bookedPlayers.map(player => {
                        const isPlayerRemovalProcessing = isProcessingActionForMatch('removePlayer', player.userId);
                        return (
                            <div key={player.userId} className="flex items-center justify-between gap-2 rounded-md border p-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`https://i.pravatar.cc/40?u=${player.userId}`} alt={player.name} data-ai-hint="player photo"/>
                                        <AvatarFallback>{getInitials(player.name || '')}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm font-medium truncate">{player.name}</span>
                                </div>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" disabled={isPlayerRemovalProcessing}>
                                            {isPlayerRemovalProcessing ? <Loader2 className="h-3 w-3 animate-spin"/> : <UserX className="h-3 w-3 text-destructive"/>}
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Eliminar a {player.name}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Se eliminará al jugador de la partida. Si se le debe devolver el dinero, tendrás que hacerlo manualmente. La plaza quedará abierta.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => onRemovePlayer(match.id, player.userId)} className="bg-destructive hover:bg-destructive/90">Sí, Eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        )
                    })}
                    {[...Array(TOTAL_SLOTS - match.bookedPlayers.length)].map((_, i) => (
                        <div key={`open-${i}`} className="flex items-center gap-2 rounded-md border border-dashed p-2 bg-muted/50">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-muted-foreground">Plaza Abierta</span>
                        </div>
                    ))}
                 </div>
            </CardContent>
            <CardFooter>
                 <p className="text-xs text-muted-foreground">ID Partida: {match.id}</p>
            </CardFooter>
        </Card>
    );
}

export default MatchAdminCard;

    