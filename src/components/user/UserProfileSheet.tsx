"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { User as UserIcon, Lock, LogOut, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getMockCurrentUser } from '@/lib/mockData';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserProfile } from '@/hooks/useUserProfile';
import UserProfileAvatar from './profile/UserProfileAvatar';
import EditableInfoRow from './profile/EditableInfoRow';
import ChangePasswordDialog from './profile/ChangePasswordDialog';
import type { MatchPadelLevel, UserGenderCategory } from '@/types';
import { matchPadelLevels, userGenderCategories } from '@/types';
import { Badge } from '@/components/ui/badge';

// ActionButton is simplified since it's only used for two actions now.
const ActionButton: React.FC<{
    label: string;
    onClick?: () => void;
    icon: React.ElementType;
    isDestructive?: boolean;
    className?: string;
    isFirst?: boolean;
    isLast?: boolean;
    showSeparator?: boolean;
}> = ({ label, onClick, icon: Icon, isDestructive, className, isFirst, isLast, showSeparator }) => {
    return (
        <button
            onClick={onClick}
            className={cn(
                "flex items-center justify-between p-3 bg-white min-h-[44px] w-full text-left",
                className,
                isFirst && "rounded-t-lg",
                isLast && "rounded-b-lg",
                showSeparator && "border-b border-gray-200"
            )}
        >
            <div className="flex items-center">
                <Icon className={cn("mr-3 h-5 w-5", isDestructive ? "text-red-500" : "text-blue-500")} />
                <span className={cn("text-sm", isDestructive ? "text-red-500" : "text-gray-800")}>{label}</span>
            </div>
        </button>
    );
};


const UserProfileSheet: React.FC = () => {
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
    const { toast } = useToast();

    useEffect(() => {
        setIsClient(true);
    }, []);

    const handlePasswordEditClick = () => {
        setIsChangePasswordDialogOpen(true);
    };
    
    if (!isClient) { 
        return (
            <div className="flex flex-col h-full bg-gray-100">
                 <DialogHeader className="p-4 border-b bg-white">
                    <DialogTitle className="flex items-center text-lg"><UserIcon className="mr-2 h-5 w-5" /> Perfil de Usuario</DialogTitle>
                    <DialogDescription className="text-xs">Cargando información...</DialogDescription>
                </DialogHeader>
                <div className="p-4 space-y-6">
                    <div className="flex flex-col items-center space-y-2"><Skeleton className="h-24 w-24 rounded-full bg-gray-300" /><Skeleton className="h-5 w-32 bg-gray-300" /></div>
                    <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-11 w-full rounded-lg bg-gray-200" />)}</div>
                    <div className="space-y-2">{[1, 2].map(i => <Skeleton key={i} className="h-11 w-full rounded-lg bg-gray-200" />)}</div>
                </div>
            </div>
        );
    }

    if (!user) { 
        return (
            <div className="flex flex-col h-full p-4 bg-gray-100">
                <DialogHeader className="mb-4">
                    <DialogTitle className="flex items-center text-lg"><UserIcon className="mr-2 h-5 w-5" /> Perfil de Usuario</DialogTitle>
                    <DialogDescription className="text-xs">Inicia sesión para ver tu perfil y gestionar tus datos.</DialogDescription>
                </DialogHeader>
                 <DialogClose asChild>
                     <Link href="/auth/login-alumno" passHref>
                         <Button className="w-full mt-auto bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg shadow-md">Iniciar Sesión / Registrarse</Button>
                     </Link>
                 </DialogClose>
            </div>
        );
    }

    const genderCategoryOptions = userGenderCategories.map(category => ({
        value: category,
        label: category.charAt(0).toUpperCase() + category.slice(1) // Capitalize first letter
    }));

    return (
        <div className="flex flex-col h-full bg-gray-100">
            <DialogHeader className="pb-3 pt-4 px-4 border-b bg-white flex-shrink-0 shadow-sm">
                <DialogTitle className="flex items-center text-xl font-semibold"><UserIcon className="mr-2 h-5 w-5 text-blue-600" /> Perfil de Usuario</DialogTitle>
                <DialogDescription className="text-sm text-gray-500">Gestiona tu información personal y preferencias.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="flex-grow">
                <div className="p-4 space-y-6">
                    <UserProfileAvatar
                        user={user}
                        profilePicUrl={profilePicUrl}
                        fileInputRef={fileInputRef}
                        onPhotoUploadClick={handlePhotoUploadClick}
                        onPhotoChange={handlePhotoChange}
                    />

                    <div className="rounded-lg shadow-xl overflow-hidden">
                        <EditableInfoRow
                            id="profile-name"
                            label="Nombre"
                            value={name}
                            isEditing={isEditingName}
                            onEditClick={() => setIsEditingName(true)}
                            onSaveClick={handleSaveName}
                            onCancelClick={() => { setIsEditingName(false); setName(user.name || ''); }}
                            onChange={handleNameChange}
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
                            onChange={handleEmailChange}
                            inputType="email"
                            showSeparator={!isEditingEmail}
                        />
                        <EditableInfoRow
                            id="profile-gender-category"
                            label="Categoría (Género)"
                            value={selectedGenderCategory}
                            isEditing={isEditingGenderCategory}
                            onEditClick={() => setIsEditingGenderCategory(true)}
                            onSaveClick={handleSaveGenderCategory}
                            onCancelClick={() => { setIsEditingGenderCategory(false); setSelectedGenderCategory(user.genderCategory); }}
                            onChange={(val) => handleGenderCategoryChange(val as UserGenderCategory)}
                            inputType="select"
                            selectOptions={genderCategoryOptions}
                            selectPlaceholder="Selecciona categoría"
                            isLast
                            showSeparator={false}
                            icon={Users}
                        />
                    </div>
                     <div className="rounded-lg shadow-xl overflow-hidden">
                        <ActionButton label="Contraseña" icon={Lock} onClick={handlePasswordEditClick} isFirst showSeparator />
                        <ActionButton label="Cerrar Sesión" icon={LogOut} onClick={handleLogout} isDestructive isLast />
                    </div>

                </div>
            </ScrollArea>
             
             {user && (
                <ChangePasswordDialog
                    isOpen={isChangePasswordDialogOpen}
                    onOpenChange={setIsChangePasswordDialogOpen}
                    userId={user.id}
                />
            )}
        </div>
    );
};

export default UserProfileSheet;
