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


function ProfilePageContent() {
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

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <PageSkeleton />;
    }

    if (!user) {
        return <div>Debes iniciar sesión para ver tu perfil.</div>;
    }

    const genderCategoryOptions = [
        { value: 'femenino', label: 'Femenino' },
        { value: 'masculino', label: 'Masculino' },
        { value: 'otro', label: 'Otro' },
        { value: 'no_especificado', label: 'No Especificado' },
    ];
    
    const levelOptions = matchPadelLevels.map(level => ({
        value: level,
        label: (level as unknown as MatchPadelLevel) === 'abierto' ? 'Nivel Abierto' : `Nivel ${level}`
    }));


    return (
        <div className="container mx-auto max-w-2xl py-8">
            <header className="mb-6">
                <h1 className="text-3xl font-bold text-foreground">Tu Perfil</h1>
                <p className="text-muted-foreground">Gestiona tu información personal, preferencias y seguridad.</p>
            </header>
            
            <main className="space-y-6">
                 <UserProfileAvatar
                    user={user}
                    profilePicUrl={profilePicUrl}
                    fileInputRef={fileInputRef}
                    onPhotoUploadClick={handlePhotoUploadClick}
                    onPhotoChange={handlePhotoChange}
                />

                <div className="rounded-lg shadow-xl overflow-hidden bg-white">
                     <EditableInfoRow
                        id="profile-name"
                        label="Nombre"
                        value={name}
                        isEditing={isEditingName}
                        onEditClick={() => setIsEditingName(true)}
                        onSaveClick={handleSaveName}
                        onCancelClick={() => { setIsEditingName(false); setName(user.name || ''); }}
                        onChange={(e) => handleNameChange(e as React.ChangeEvent<HTMLInputElement>)}
                        isFirst
                        showSeparator={!isEditingName}
                    />
                    <EditableInfoRow
                        id="profile-email"
                        label="Email"
                        value={email}
                        isEditing={isEditingEmail}
                        onEditClick={() => setIsEditingEmail(true)}
                        onSaveClick={handleSaveEmail}
                        onCancelClick={() => { setIsEditingEmail(false); setEmail(user.email || ''); }}
                        onChange={(e) => handleEmailChange(e as React.ChangeEvent<HTMLInputElement>)}
                        inputType="email"
                        showSeparator={!isEditingEmail}
                    />
                     <EditableInfoRow
                        id="profile-level"
                        label="Nivel de Juego"
                        value={selectedLevel}
                        isEditing={isEditingLevel}
                        onEditClick={() => setIsEditingLevel(true)}
                        onSaveClick={handleSaveLevel}
                        onCancelClick={() => { setIsEditingLevel(false); setSelectedLevel(user.level); }}
                        onChange={(val) => handleLevelChange(val as MatchPadelLevel)}
                        inputType="select"
                        selectOptions={levelOptions}
                        selectPlaceholder="Selecciona tu nivel"
                        showSeparator={!isEditingLevel}
                    />
                    <EditableInfoRow
                        id="profile-gender"
                        label="Categoría (Género)"
                        value={selectedGenderCategory}
                        isEditing={isEditingGenderCategory}
                        onEditClick={() => setIsEditingGenderCategory(true)}
                        onSaveClick={handleSaveGenderCategory}
                        onCancelClick={() => { setIsEditingGenderCategory(false); setSelectedGenderCategory(user.genderCategory); }}
                        onChange={(val) => handleGenderCategoryChange(val as UserGenderCategory)}
                        inputType="select"
                        selectOptions={genderCategoryOptions}
                        selectPlaceholder="Selecciona tu categoría"
                        isLast
                        showSeparator={false}
                    />
                </div>

                <div className="rounded-lg shadow-xl overflow-hidden">
                    <button onClick={() => setIsChangePasswordDialogOpen(true)} className="flex items-center justify-between p-3 bg-white w-full text-left rounded-t-lg border-b border-gray-200">
                        <span className="text-sm">Contraseña</span>
                        <span className="text-sm text-gray-500">••••••••</span>
                    </button>
                    <button onClick={handleLogout} className="flex items-center justify-between p-3 bg-white w-full text-left rounded-b-lg text-red-500">
                        <span className="text-sm">Cerrar Sesión</span>
                    </button>
                </div>
            </main>
             <ChangePasswordDialog
                isOpen={isChangePasswordDialogOpen}
                onOpenChange={setIsChangePasswordDialogOpen}
                userId={user.id}
            />
        </div>
    );
}


export default function ProfilePage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ProfilePageContent />
        </Suspense>
    );
}