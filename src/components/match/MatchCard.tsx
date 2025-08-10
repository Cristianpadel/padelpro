// src/components/match/MatchCard.tsx
"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import type { Match, User, Club, PadelCourt } from '@/types';
import { getMockStudents, getMockClubs, bookMatch, confirmMatchAsPrivate, joinPrivateMatch, makeMatchPublic, bookCourtForMatchWithPoints, calculateActivityPrice, getCourtAvailabilityForInterval } from '@/lib/mockData';
import { displayClassCategory } from '@/types';
import { format, differenceInMinutes, differenceInDays, startOfDay, parse, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn, getInitials, getPlaceholderUserName, calculatePricePerPerson, hexToRgba } from '@/lib/utils';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from '@/components/ui/input';
import { Clock, Users, Plus, Loader2, Gift, CreditCard, AlertTriangle, Lock, Star, Share2, Hash, Users2 as CategoryIcon, Venus, Mars, BarChartHorizontal, Lightbulb } from 'lucide-react';

const InfoDialog: React.FC<{
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  icon: React.ElementType;
}> = ({ isOpen, onOpenChange, title, description, icon: Icon }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <Icon className="mr-3 h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 text-base text-muted-foreground leading-relaxed whitespace-pre-line">
            {description.split('\n').map((item, key) => (
                <p key={key} className="mb-2">{`• ${item}`}</p>
            ))}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="w-full">¡Entendido!</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


const PlayerSpot: React.FC<{
  player?: { userId: string, name?: string };
  isCurrentUser?: boolean;
}> = ({ player, isCurrentUser }) => {
    if (!player) return null;

    const student = getMockStudents().find(u => u.id === player.userId);

    return (
        <div className="flex flex-col items-center space-y-1">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Avatar className={cn("h-12 w-12", isCurrentUser && "ring-2 ring-primary ring-offset-2")}>
                            <AvatarImage src={student?.profilePictureUrl} alt={student?.name} data-ai-hint="player avatar medium" />
                            <AvatarFallback>{getInitials(student?.name || 'P')}</AvatarFallback>
                        </Avatar>
                    </TooltipTrigger>
                    <TooltipContent><p>{student?.name || 'Jugador'}</p></TooltipContent>
                </Tooltip>
            </TooltipProvider>
             <span className="text-[10px] text-muted-foreground">Ocupado</span>
        </div>
    );
};

const EmptySpot: React.FC<{
  price: number;
  isDisabled: boolean;
  tooltipText: string;
  onClick: () => void;
}> = ({ price, isDisabled, tooltipText, onClick }) => (
    <div className="flex flex-col items-center space-y-1">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <button onClick={onClick} disabled={isDisabled} className={cn("h-12 w-12 rounded-full border-2 border-dashed flex items-center justify-center transition-colors", isDisabled ? 'border-gray-200 cursor-not-allowed' : 'border-green-400 hover:bg-green-50')}>
                        <Plus className={cn("h-6 w-6", isDisabled ? 'text-gray-300' : 'text-green-500')} />
                    </button>
                </TooltipTrigger>
                <TooltipContent><p>{tooltipText}</p></TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <span className="text-xs font-semibold text-muted-foreground">{price.toFixed(2)}€</span>
    </div>
);

const CourtStatusIcon: React.FC<{ isAvailable: boolean }> = ({ isAvailable }) => {
    const fillColor = isAvailable ? "#4ade80" : "#d1d5db"; // green-400 or gray-300
    const strokeColor = isAvailable ? "#22c55e" : "#9ca3af"; // green-500 or gray-400

    return (
        <svg width="18" height="26" viewBox="0 0 18 26" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <rect width="18" height="26" rx="3" fill={fillColor} />
            <rect x="2" y="2" width="14" height="9" rx="2" stroke={strokeColor} strokeWidth="1.5" />
            <rect x="2" y="15" width="14" height="9" rx="2" stroke={strokeColor} strokeWidth="1.5" />
            <line x1="2" y1="12.5" x2="16" y2="12.5" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
    );
};


interface MatchCardProps {
  match: Match;
  currentUser: User;
  onBookingSuccess: () => void;
  onMatchUpdate: (updatedMatch: Match) => void;
  matchShareCode?: string | null;
  showPointsBonus: boolean;
}


const MatchCard: React.FC<MatchCardProps> = React.memo(({ match: initialMatch, currentUser, onBookingSuccess }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();
    const [currentMatch, setCurrentMatch] = useState<Match>(initialMatch);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [courtAvailability, setCourtAvailability] = useState<{ available: PadelCourt[], occupied: PadelCourt[], total: number }>({ available: [], occupied: [], total: 0 });
    const [infoDialog, setInfoDialog] = useState<{ open: boolean, title: string, description: string, icon: React.ElementType }>({ open: false, title: '', description: '', icon: Lightbulb });
    const [isConfirmPrivateDialogOpen, setIsConfirmPrivateDialogOpen] = useState(false);
    const [isProcessingPrivateAction, setIsProcessingPrivateAction] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const club = getMockClubs().find(c => c.id === initialMatch.clubId);
            setClubInfo(club || null);
            if (club) {
                const availability = await getCourtAvailabilityForInterval(initialMatch.clubId, new Date(initialMatch.startTime), new Date(initialMatch.endTime));
                setCourtAvailability(availability);
            }
        };
        loadData();
        setCurrentMatch(initialMatch);
    }, [initialMatch]);

    const isUserBooked = useMemo(() => currentMatch.bookedPlayers.some(p => p.userId === currentUser.id), [currentMatch.bookedPlayers, currentUser.id]);
    const isPlaceholderMatch = currentMatch.isPlaceholder;

    const pricePerPlayer = useMemo(() => {
        if (clubInfo) {
            const courtPrice = calculateActivityPrice(clubInfo, new Date(currentMatch.startTime));
            return calculatePricePerPerson(courtPrice, 4);
        }
        return 0;
    }, [clubInfo, currentMatch.startTime]);
    
    const handleJoinClick = () => {
      // Logic from old component's MatchSpotDisplay
      if(!currentUser) return;

      const hasEnoughCredit = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0) >= pricePerPlayer;
      if (!hasEnoughCredit) {
         toast({ title: "Saldo Insuficiente", description: `Necesitas ${pricePerPlayer.toFixed(2)}€ para unirte.` });
         return;
      }
      setShowConfirmDialog(true);
    };

    const handleConfirmJoin = () => {
        startTransition(async () => {
            const result = await bookMatch(currentUser.id, currentMatch.id);
            if ('error' in result) {
                toast({ title: 'Error al Unirse', description: result.error, variant: 'destructive' });
            } else {
                toast({ title: '¡Inscrito!', description: 'Te has unido a la partida.', className: 'bg-primary text-primary-foreground' });
                onBookingSuccess();
            }
            setShowConfirmDialog(false);
        });
    };

    const handleConfirmPrivate = () => {
        setIsProcessingPrivateAction(true);
        startTransition(async () => {
            const result = await confirmMatchAsPrivate(currentUser.id, currentMatch.id, false);
            if ('error' in result) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' });
            } else {
                 toast({
                    title: "¡Partida Privada Creada!",
                    description: "Comparte el enlace con tus amigos para que se unan.",
                    duration: 10000
                });
                onMatchUpdate(result.updatedMatch);
            }
            setIsConfirmPrivateDialogOpen(false);
            setIsProcessingPrivateAction(false);
        });
    };

    const handleInfoClick = (type: 'level' | 'court' | 'category') => {
        let dialogContent;
        const matchLevelToDisplay = isPlaceholderMatch ? 'abierto' : currentMatch.level || 'abierto';
        const matchCategoryToDisplay = isPlaceholderMatch ? 'abierta' : currentMatch.category || 'abierta'; 
        const CategoryIconDisplay = matchCategoryToDisplay === 'chica' ? Venus : matchCategoryToDisplay === 'chico' ? Mars : CategoryIcon;

        switch (type) {
            case 'level':
                 dialogContent = { title: 'Nivel', description: `El nivel de la partida lo define el primer jugador que se inscribe.\nEsto asegura que las partidas sean siempre equilibradas.`, icon: Lightbulb };
                 break;
            case 'court':
                 dialogContent = { title: 'Pista', description: `La pista se asigna automáticamente solo cuando la partida está completa (4 jugadores).\nRecibirás una notificación con el número de pista cuando se confirme.`, icon: Hash };
                 break;
            case 'category':
                 dialogContent = { title: 'Categoría', description: `La categoría (chicos/chicas) la sugiere el primer jugador que se apunta.\nNo es una regla estricta, solo una guía para los demás.`, icon: CategoryIconDisplay };
                 break;
        }
        setInfoDialog({ open: true, ...dialogContent });
    };

    if (!currentUser || !clubInfo) return <Skeleton className="h-[280px] w-full" />;
    
    const canBookPrivate = (currentMatch.bookedPlayers || []).length === 0 && isPlaceholderMatch;

    return (
        <>
            <Card className="w-full transition-shadow duration-300 flex flex-col bg-card border-l-4 border-l-green-400">
                <CardHeader className="pb-3 pt-3 px-3">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0 text-center font-bold bg-muted p-1 rounded-md w-14">
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "EEE", { locale: es })}</p>
                                <p className="text-3xl leading-none">{format(new Date(currentMatch.startTime), "d")}</p>
                                <p className="text-xs uppercase">{format(new Date(currentMatch.startTime), "MMM", { locale: es })}</p>
                            </div>
                             <div className="flex flex-col">
                                <span className="font-semibold text-lg">{format(new Date(currentMatch.startTime), 'HH:mm')}h</span>
                                <span className="text-sm text-muted-foreground flex items-center"><Clock className="mr-1 h-3.5 w-3.5"/>{currentMatch.durationMinutes || 90} min</span>
                                <span className="text-sm text-muted-foreground">{clubInfo?.name || 'Club Padel'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Share2 className="h-4 w-4"/></Button>
                             {canBookPrivate && (
                                <Button className="bg-purple-600 text-white rounded-lg h-9 px-3 flex items-center gap-1 shadow-md hover:bg-purple-700" onClick={() => setIsConfirmPrivateDialogOpen(true)}>
                                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-white/20"><Plus className="h-4 w-4"/></div>
                                    <div className="flex flex-col items-start leading-none -space-y-1">
                                         <span className="text-[10px]">Reservar</span>
                                         <span className="font-bold">Privada</span>
                                    </div>
                                </Button>
                             )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="px-3 pb-3 flex-grow">
                     <div className="flex justify-around items-center gap-1.5 my-2">
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200" onClick={() => handleInfoClick('category')}><Users2 className="mr-1.5 h-4 w-4"/>Cat.</Button>
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200" onClick={() => handleInfoClick('court')}><Hash className="mr-1.5 h-4 w-4"/>Pista</Button>
                         <Button variant="outline" className="flex-1 h-8 rounded-full shadow-inner bg-slate-50 border-slate-200" onClick={() => handleInfoClick('level')}><BarChartHorizontal className="mr-1.5 h-4 w-4"/>Nivel</Button>
                     </div>

                    <div className="grid grid-cols-4 gap-2 items-start justify-items-center mt-3">
                        {Array.from({ length: 4 }).map((_, index) => {
                            const player = currentMatch.bookedPlayers?.[index];
                            if (player) {
                                return <PlayerSpot key={player.userId} player={player} isCurrentUser={player.userId === currentUser.id} />;
                            }
                            return <EmptySpot key={index} price={pricePerPlayer} isDisabled={isUserBooked} tooltipText={isUserBooked ? 'Ya estás inscrito' : 'Unirse a la partida'} onClick={handleJoinClick} />;
                        })}
                    </div>
                     <div className="mt-4">
                        <p className="text-xs font-medium text-slate-600 mb-1 text-center">Pistas disponibles:</p>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg shadow-inner w-full">
                           <div className="flex items-center justify-center gap-x-2 flex-wrap">
                                 <div className="flex flex-col items-center mr-1">
                                     <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-700 text-sm border-2 border-white shadow">
                                         {courtAvailability.available.length}/{courtAvailability.total}
                                     </div>
                                 </div>
                               {Array.from({length: courtAvailability.total}).map((_, i) => <CourtStatusIcon key={i} isAvailable={i < courtAvailability.available.length} />)}
                           </div>
                       </div>
                    </div>
                </CardContent>
            </Card>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Inscripción</AlertDialogTitle><AlertDialogDescription>Te vas a apuntar a una partida. Coste: {pricePerPlayer.toFixed(2)}€.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmJoin} disabled={isPending}>{isPending ? <Loader2 className="animate-spin" /> : "Confirmar"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={isConfirmPrivateDialogOpen} onOpenChange={setIsConfirmPrivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Confirmar Partida Privada</AlertDialogTitle><AlertDialogDescription>Pagarás la partida entera ahora ({(pricePerPlayer * 4).toFixed(2)}€) y recibirás un enlace para compartir. Se te devolverá la parte de cada amigo que se una.</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel disabled={isProcessingPrivateAction}>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleConfirmPrivate} disabled={isProcessingPrivateAction}>{isProcessingPrivateAction ? <Loader2 className="animate-spin" /> : "Confirmar y Pagar"}</AlertDialogAction></AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <InfoDialog isOpen={infoDialog.open} onOpenChange={(open) => setInfoDialog(prev => ({ ...prev, open }))} title={infoDialog.title} description={infoDialog.description} icon={infoDialog.icon} />
        </>
    );
});
MatchCard.displayName = 'MatchCard';
export default MatchCard;
