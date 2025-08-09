
// src/app/(app)/dashboard/page.tsx
"use client";

import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { getMockCurrentUser, setGlobalCurrentUser, updateUserLevel, updateUserGenderCategory } from '@/lib/mockData';
import type { User, MatchPadelLevel, UserGenderCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Settings, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PageSkeleton from '@/components/layout/PageSkeleton';
import { useRouter } from 'next/navigation';
import UserProfileSheet from '@/components/user/profile/UserProfileSheet';
import { matchPadelLevels } from '@/types';
import EditableInfoRow from '@/components/user/profile/EditableInfoRow';
import { Badge } from '@/components/ui/badge';
import UserProfileAvatar from '@/components/user/profile/UserProfileAvatar';
import ChangePasswordDialog from '@/components/user/profile/ChangePasswordDialog';
import { useUserProfile } from '@/hooks/useUserProfile';
import { RecommendedClasses } from './components/RecommendedClasses';
import PersonalSchedule from '@/components/schedule/PersonalSchedule';
import PersonalMatches from '@/components/schedule/PersonalMatches';
import PersonalMatchDay from '@/components/schedule/PersonalMatchDay';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Wallet, Star, History, Repeat, PlusCircle, PiggyBank, Lock } from 'lucide-react';
import CreditMovementsDialog from '@/components/user/CreditMovementsDialog';
import PointMovementsDialog from '@/components/user/PointMovementsDialog';
import AddCreditDialog from '@/components/user/AddCreditDialog';
import ConvertBalanceDialog from '@/components/user/ConvertBalanceDialog';
import EditLevelDialog from '@/components/user/EditLevelDialog';


function DashboardPageContent() {
    const {
        user,
        name, setName, isEditingName, setIsEditingName, handleNameChange, handleSaveName,
        email, setEmail, isEditingEmail, setIsEditingEmail, handleEmailChange, handleSaveEmail,
        selectedLevel, setSelectedLevel, isEditingLevel, setIsEditingLevel, handleLevelChange, handleSaveLevel,
        selectedGenderCategory, setSelectedGenderCategory, isEditingGenderCategory, setIsEditingGenderCategory, handleGenderCategoryChange, handleSaveGenderCategory,
        profilePicUrl, fileInputRef, handlePhotoUploadClick, handlePhotoChange,
        handleLogout
    } = useUserProfile(getMockCurrentUser());
    
    const [isClient, setIsClient] = useState(false);
    const [isChangePasswordDialogOpen, setIsChangePasswordDialogOpen] = useState(false);
    const [isCreditMovementsDialogOpen, setIsCreditMovementsDialogOpen] = useState(false);
    const [isPointMovementsDialogOpen, setIsPointMovementsDialogOpen] = useState(false);
    const [isAddCreditDialogOpen, setIsAddCreditDialogOpen] = useState(false);
    const [isConvertBalanceDialogOpen, setIsConvertBalanceDialogOpen] = useState(false);
    const [isEditLevelDialogOpen, setIsEditLevelDialogOpen] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
    }, []);
    
    const handleDataChange = useCallback(() => {
        setRefreshKey(prev => prev + 1);
    }, []);
    
    const handleCreditAdded = (newBalance: number) => {
        handleDataChange();
        toast({
            title: "¡Saldo Añadido!",
            description: `Tu nuevo saldo es ${newBalance.toFixed(2)}€.`,
            className: "bg-primary text-primary-foreground",
        });
    };

    const handleConversionSuccess = (newCredit: number, newPoints: number) => {
        handleDataChange();
        toast({
            title: "¡Conversión Exitosa!",
            description: `Saldo restante: ${newCredit.toFixed(2)}€. Nuevos puntos: ${newPoints}.`,
            className: "bg-primary text-primary-foreground",
        });
    };

    if (!isClient || !user) {
        return <PageSkeleton />;
    }
    
    const availableCredit = (user.credit ?? 0) - (user.blockedCredit ?? 0);
    const hasPendingPoints = (user.pendingBonusPoints ?? 0) > 0;

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">
                    Tu Agenda, {user.name}
                </h1>
                <p className="text-muted-foreground">Aquí tienes un resumen de tu actividad y saldo.</p>
            </header>
            
            <main className="space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="shadow-md">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-lg flex items-center text-green-700">
                                <Wallet className="mr-2.5 h-5 w-5" />
                                Tu Saldo
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="text-4xl font-bold text-foreground">{availableCredit.toFixed(2)}€</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <div className="flex-1 p-2 bg-muted rounded-md text-center">
                                    <p className="flex items-center justify-center gap-1"><PiggyBank className="h-3 w-3"/> Total</p>
                                    <p className="font-semibold text-foreground">{(user.credit ?? 0).toFixed(2)}€</p>
                                </div>
                                <div className="flex-1 p-2 bg-muted rounded-md text-center">
                                    <p className="flex items-center justify-center gap-1"><Lock className="h-3 w-3"/> Bloqueado</p>
                                    <p className="font-semibold text-foreground">{(user.blockedCredit ?? 0).toFixed(2)}€</p>
                                </div>
                            </div>
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
                        <CardContent className="space-y-3">
                            <div className="text-4xl font-bold text-foreground">{(user.loyaltyPoints ?? 0).toFixed(0)}</div>
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <p>Puntos de fidelidad para canjear.</p>
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

                <RecommendedClasses />

                <PersonalMatches 
                    currentUser={user} 
                    newMatchBooking={null} 
                    onBookingActionSuccess={handleDataChange} 
                />
                <PersonalSchedule 
                    currentUser={user} 
                    onBookingActionSuccess={handleDataChange} 
                    refreshKey={refreshKey}
                />
                <PersonalMatchDay 
                    currentUser={user} 
                    onBookingActionSuccess={handleDataChange} 
                />
            </main>
             <CreditMovementsDialog
                isOpen={isCreditMovementsDialogOpen}
                onOpenChange={setIsCreditMovementsDialogOpen}
                currentUser={user}
            />
            <PointMovementsDialog
                isOpen={isPointMovementsDialogOpen}
                onOpenChange={setIsPointMovementsDialogOpen}
                currentUser={user}
            />
            <AddCreditDialog
                isOpen={isAddCreditDialogOpen}
                onOpenChange={setIsAddCreditDialogOpen}
                userId={user.id}
                onCreditAdded={handleCreditAdded}
            />
            <ConvertBalanceDialog
                isOpen={isConvertBalanceDialogOpen}
                onOpenChange={setIsConvertBalanceDialogOpen}
                currentUser={user}
                onConversionSuccess={handleConversionSuccess}
            />
        </div>
    );
}


export default function DashboardPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <DashboardPageContent />
        </Suspense>
    );
}

