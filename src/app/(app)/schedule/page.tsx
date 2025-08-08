// src/app/(app)/schedule/page.tsx
"use client";

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import Footer from '@/components/layout/Footer';
import PersonalSchedule from '@/components/schedule/PersonalSchedule';
import PersonalMatches from '@/components/schedule/PersonalMatches';
import PersonalMatchDay from '@/components/schedule/PersonalMatchDay'; 
import { getMockCurrentUser, getMockClubs, setGlobalCurrentUser, getMockUserBookings, getMockTimeSlots, isSlotEffectivelyCompleted, getMockUserMatchBookings, getMockMatches, updateUserLevel } from '@/lib/mockData'; 
import { recommendClasses, type RecommendClassesOutput } from '@/ai/flows/recommend-classes';
import type { User, Booking, MatchBooking, Club, MatchPadelLevel, ClassPadelLevel } from '@/types';
import { Button } from '@/components/ui/button';
import { CalendarDays, User as UserIcon, Wallet, Star, History, Repeat, PlusCircle, Settings, Wallet2, UserPlus, Edit, AlertCircle, HelpCircle, Activity, Trophy, Lightbulb } from 'lucide-react';
import Link from 'next/link';
import { Toaster } from '@/components/ui/toaster';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import CreditMovementsDialog from '@/components/user/CreditMovementsDialog';
import PointMovementsDialog from '@/components/user/PointMovementsDialog';
import AddCreditDialog from '@/components/user/AddCreditDialog'; 
import ConvertBalanceDialog from '@/components/user/ConvertBalanceDialog'; 
import { useToast } from '@/hooks/use-toast';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import UserProfileSheet from '@/components/user/UserProfileSheet';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import EditLevelDialog from '@/components/user/EditLevelDialog';
import { displayClassLevel } from '@/types';

function SchedulePageContent() {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [clubInfo, setClubInfo] = useState<Club | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isCreditMovementsDialogOpen, setIsCreditMovementsDialogOpen] = useState(false);
    const [isPointMovementsDialogOpen, setIsPointMovementsDialogOpen] = useState(false);
    const [isAddCreditDialogOpen, setIsAddCreditDialogOpen] = useState(false); 
    const [isConvertBalanceDialogOpen, setIsConvertBalanceDialogOpen] = useState(false);
    const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);
    const [isEditLevelDialogOpen, setIsEditLevelDialogOpen] = useState(false);
    const [confirmedBookingsCount, setConfirmedBookingsCount] = useState(0);
    const [unconfirmedInscriptionsCount, setUnconfirmedInscriptionsCount] = useState(0);
    const [recommendations, setRecommendations] = useState<RecommendClassesOutput | null>(null);
    const [loadingRecommendations, setLoadingRecommendations] = useState(true);

    const { toast } = useToast();
    const router = useRouter();


    const fetchCurrentUser = useCallback(() => {
        const user = getMockCurrentUser();
        setCurrentUser(user ? { ...user } : null); 
    }, []);

    useEffect(() => {
        setIsClient(true);
        fetchCurrentUser();
        const clubs = getMockClubs();
        if (clubs.length > 0) {
            setClubInfo(clubs[0]); // Default to first club for display, can be enhanced
        }
    }, [fetchCurrentUser]);

    const handleDataChange = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        fetchCurrentUser(); 
    }, [fetchCurrentUser]);

    const handleLevelSave = async (newLevel: MatchPadelLevel) => {
        if (!currentUser) return;
        const result = await updateUserLevel(currentUser.id, newLevel);
        if ('error' in result) {
            toast({ title: "Error al actualizar nivel", description: result.error, variant: "destructive" });
        } else {
            toast({ title: "Nivel Actualizado", description: `Tu nivel de juego es ahora ${newLevel}.` });
            handleDataChange(); // Refresh data
        }
        setIsEditLevelDialogOpen(false);
    };

    // Fetch AI recommendations
    useEffect(() => {
        if (currentUser?.id) {
            setLoadingRecommendations(true);
            const mockUserInput = {
                bookingHistory: 'Beginner group classes, several friendly matches.',
                skillLevel: parseFloat(currentUser.level || '2.5'),
            };
            recommendClasses(mockUserInput)
                .then(setRecommendations)
                .catch(err => console.error("Error fetching recommendations:", err))
                .finally(() => setLoadingRecommendations(false));
        }
    }, [currentUser?.id, currentUser?.level, refreshKey]);

     useEffect(() => {
        if (!currentUser) {
            setConfirmedBookingsCount(0);
            setUnconfirmedInscriptionsCount(0);
            return;
        }

        const calculateBookings = () => {
            let confirmedCount = 0;
            let unconfirmedCount = 0;
            const now = new Date();

            const userClassBookings = getMockUserBookings().filter(b => b.userId === currentUser.id);
            const allTimeSlots = getMockTimeSlots();
            userClassBookings.forEach(booking => {
                const slot = allTimeSlots.find(s => s.id === booking.activityId);
                if (slot && new Date(slot.startTime) > now) {
                    if (isSlotEffectivelyCompleted(slot).completed) {
                        confirmedCount++;
                    } else if (slot.status === 'pre_registration') {
                        unconfirmedCount++;
                    }
                }
            });

            const userMatchBookings = getMockUserMatchBookings().filter(b => b.userId === currentUser.id);
            const allMatches = getMockMatches();
            userMatchBookings.forEach(booking => {
                 const match = allMatches.find(m => m.id === booking.activityId);
                 if (match && new Date(match.startTime) > now) {
                    if (match.status === 'confirmed' || match.status === 'confirmed_private') {
                        confirmedCount++;
                    } else if (match.status === 'forming') {
                        unconfirmedCount++;
                    }
                }
            });
            setConfirmedBookingsCount(confirmedCount);
            setUnconfirmedInscriptionsCount(unconfirmedCount);
        };

        calculateBookings();
        const interval = setInterval(calculateBookings, 5000); 

        return () => clearInterval(interval);
    }, [currentUser, refreshKey]);

    const handleLogout = () => {
        setGlobalCurrentUser(null);
        toast({ title: "Sesión cerrada" });
        router.push('/');
    };

    const handleCreditAdded = (newBalance: number) => {
        fetchCurrentUser(); 
        toast({
            title: "¡Saldo Añadido!",
            description: `Tu nuevo saldo es ${newBalance.toFixed(2)}€.`,
            className: "bg-primary text-primary-foreground",
        });
    };

    const handleConversionSuccess = (newCredit: number, newPoints: number) => {
        fetchCurrentUser(); 
        toast({
            title: "¡Conversión Exitosa!",
            description: `Saldo restante: ${newCredit.toFixed(2)}€. Nuevos puntos: ${newPoints}.`,
            className: "bg-primary text-primary-foreground",
        });
    };

    if (!isClient) {
        return <PageSkeleton />;
    }

    if (!currentUser) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <main className="flex-grow container mx-auto px-4 py-8 text-center">
                    <div className="bg-card p-8 rounded-lg shadow-xl max-w-md mx-auto">
                        <UserIcon className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                        <h1 className="text-2xl font-semibold mb-3 text-foreground">Acceso Requerido</h1>
                        <p className="text-muted-foreground mb-6">
                            Debes iniciar sesión para ver tu agenda personal.
                        </p>
                        <Link href="/auth/login-alumno" passHref>
                            <Button className="w-full">Iniciar Sesión</Button>
                        </Link>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }
    
    const availableCredit = (currentUser.credit ?? 0) - (currentUser.blockedCredit ?? 0);
    const availablePoints = (currentUser.loyaltyPoints ?? 0) - (currentUser.blockedLoyaltyPoints ?? 0);
    const hasPendingPoints = (currentUser.pendingBonusPoints ?? 0) > 0;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header className="flex flex-wrap justify-between items-center gap-y-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">
                        {`Hola, ${currentUser.name}`}
                    </h1>
                    {currentUser.level && (
                        <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-base font-semibold py-1 px-3 border-primary text-primary">
                                Nivel: {currentUser.level}
                            </Badge>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:text-primary/80" onClick={() => setIsEditLevelDialogOpen(true)} aria-label="Editar nivel">
                                <Edit className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                </div>
            </header>

            <main className="w-full space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center text-green-700">
                                <Wallet className="mr-2.5 h-5 w-5" />
                                Tu Saldo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                                <div className="text-4xl font-bold text-foreground">{availableCredit.toFixed(2)}€</div>
                                <p className="text-sm text-muted-foreground">
                                Total: {(currentUser.credit ?? 0).toFixed(2)}€ | Bloqueado: {(currentUser.blockedCredit ?? 0).toFixed(2)}€
                                </p>
                                <div className="flex items-center gap-2 pt-2">
                                    <Button variant="default" size="sm" onClick={() => setIsAddCreditDialogOpen(true)} className="flex-1 bg-green-600 hover:bg-green-700">
                                    <PlusCircle className="mr-1.5 h-4 w-4" />
                                    Añadir
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsCreditMovementsDialogOpen(true)} className="flex-1">
                                    <History className="mr-1 h-3.5 w-3.5" /> Movimientos
                                </Button>
                                </div>
                        </CardContent>
                    </Card>
                        <Card className="shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center text-amber-600">
                                <Star className="mr-2.5 h-5 w-5" />
                                Tus Puntos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                                <div className="flex justify-between items-start">
                                <div>
                                    <div className="text-4xl font-bold text-foreground">{availablePoints.toFixed(2)}</div>
                                    <p className="text-sm text-muted-foreground">
                                        Total: {(currentUser.loyaltyPoints ?? 0).toFixed(2)} | Bloqueados: {(currentUser.blockedLoyaltyPoints ?? 0).toFixed(2)}
                                    </p>
                                </div>
                                {hasPendingPoints && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div className="text-center cursor-help">
                                                    <p className="text-xs text-muted-foreground">Pendientes</p>
                                                    <div className="mt-1 inline-flex items-center justify-center rounded-lg bg-muted px-3 py-1 text-lg font-bold text-muted-foreground shadow-inner">
                                                        +{Math.round(currentUser.pendingBonusPoints ?? 0)}
                                                    </div>
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Puntos que ganarás al confirmarse tus pre-inscripciones.</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                                </div>
                                <div className="flex items-center gap-2 pt-2">
                                    <Button variant="default" size="sm" onClick={() => setIsConvertBalanceDialogOpen(true)} className="flex-1 bg-amber-500 hover:bg-amber-600">
                                    <Repeat className="mr-1.5 h-4 w-4" />
                                    Convertir
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setIsPointMovementsDialogOpen(true)} className="flex-1">
                                    <History className="mr-1 h-3.5 w-3.5" /> Movimientos
                                </Button>
                                </div>
                        </CardContent>
                    </Card>
                </div>
                
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center"><Lightbulb className="mr-2 h-5 w-5 text-yellow-500" />Sugerencias para ti</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {loadingRecommendations ? (
                            <div className="text-center text-muted-foreground">Buscando recomendaciones...</div>
                        ) : recommendations && recommendations.recommendedClasses.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {recommendations.recommendedClasses.slice(0, 3).map((rec, index) => (
                                    <Link key={index} href={`/activities?view=clases`} passHref>
                                        <div className="p-3 border rounded-lg hover:bg-muted transition-colors cursor-pointer">
                                            <p className="font-semibold text-primary">{rec}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center text-muted-foreground">No hay recomendaciones nuevas en este momento.</p>
                        )}
                    </CardContent>
                </Card>
                <PersonalMatches 
                    currentUser={currentUser} 
                    newMatchBooking={null} 
                    onBookingActionSuccess={handleDataChange} 
                />
                <PersonalSchedule 
                    currentUser={currentUser} 
                    onBookingActionSuccess={handleDataChange} 
                    refreshKey={refreshKey}
                />
                <PersonalMatchDay 
                    currentUser={currentUser} 
                    onBookingActionSuccess={handleDataChange} 
                />
            </main>

            <Toaster />
            {currentUser && (
                <>
                    <CreditMovementsDialog
                        isOpen={isCreditMovementsDialogOpen}
                        onOpenChange={setIsCreditMovementsDialogOpen}
                        currentUser={currentUser}
                    />
                    <PointMovementsDialog
                        isOpen={isPointMovementsDialogOpen}
                        onOpenChange={setIsPointMovementsDialogOpen}
                        currentUser={currentUser}
                    />
                    <AddCreditDialog
                        isOpen={isAddCreditDialogOpen}
                        onOpenChange={setIsAddCreditDialogOpen}
                        userId={currentUser.id}
                        onCreditAdded={handleCreditAdded}
                    />
                    <ConvertBalanceDialog
                        isOpen={isConvertBalanceDialogOpen}
                        onOpenChange={setIsConvertBalanceDialogOpen}
                        currentUser={currentUser}
                        onConversionSuccess={handleConversionSuccess}
                    />
                    <EditLevelDialog 
                        isOpen={isEditLevelDialogOpen}
                        onOpenChange={setIsEditLevelDialogOpen}
                        currentLevel={currentUser.level}
                        onSave={handleLevelSave}
                    />
                </>
            )}
        </div>
    );
}

export default function SchedulePage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <SchedulePageContent />
        </Suspense>
    );
}
