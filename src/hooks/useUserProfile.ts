// src/hooks/useUserProfile.ts
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { User, MatchPadelLevel, UserGenderCategory } from '@/types';
import { updateUserProfile } from '@/lib/mockData';

export const useUserProfile = (initialUser: User | null) => {
    const [user, setUser] = useState<User | null>(initialUser);

    // State for editable fields
    const [name, setName] = useState(initialUser?.name || '');
    const [email, setEmail] = useState(initialUser?.email || '');
    const [selectedLevel, setSelectedLevel] = useState<MatchPadelLevel | undefined>(initialUser?.level);
    const [selectedGenderCategory, setSelectedGenderCategory] = useState<UserGenderCategory | undefined>(initialUser?.genderCategory);

    // State for editing modes
    const [isEditingName, setIsEditingName] = useState(false);
    const [isEditingEmail, setIsEditingEmail] = useState(false);
    const [isEditingLevel, setIsEditingLevel] = useState(false);
    const [isEditingGenderCategory, setIsEditingGenderCategory] = useState(false);

    // State for profile picture
    const [profilePicUrl, setProfilePicUrl] = useState<string | null>(initialUser?.profilePictureUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { toast } = useToast();

    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
            setName(initialUser.name || '');
            setEmail(initialUser.email || '');
            setSelectedLevel(initialUser.level);
            setSelectedGenderCategory(initialUser.genderCategory);
            setProfilePicUrl(initialUser.profilePictureUrl || null);
        }
    }, [initialUser]);

    const handleSave = async (field: keyof User, value: any, fieldName: string) => {
        if (!user) return;
        const result = await updateUserProfile(user.id, { [field]: value });
        if ('error' in result) {
            toast({ title: `Error al guardar ${fieldName}`, description: result.error, variant: 'destructive' });
        } else {
            setUser(result); // Update local user state
            toast({ title: `${fieldName} actualizado`, description: `Tu ${fieldName.toLowerCase()} ha sido guardado.` });
        }
    };
    
    // Name
    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value);
    const handleSaveName = () => {
        handleSave('name', name, 'Nombre');
        setIsEditingName(false);
    };

    // Email
    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
    const handleSaveEmail = () => {
        handleSave('email', email, 'Email');
        setIsEditingEmail(false);
    };

    // Level
    const handleLevelChange = (value: MatchPadelLevel) => setSelectedLevel(value);
    const handleSaveLevel = () => {
        if (selectedLevel) {
            handleSave('level', selectedLevel, 'Nivel');
        }
        setIsEditingLevel(false);
    };
    
    // Gender Category
    const handleGenderCategoryChange = (value: UserGenderCategory) => setSelectedGenderCategory(value);
    const handleSaveGenderCategory = () => {
        if (selectedGenderCategory) {
            handleSave('genderCategory', selectedGenderCategory, 'Categoría');
        }
        setIsEditingGenderCategory(false);
    };


    // Photo Upload
    const handlePhotoUploadClick = () => fileInputRef.current?.click();
    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newProfilePicUrl = reader.result as string;
                setProfilePicUrl(newProfilePicUrl);
                // Here you would typically upload the file to a server
                handleSave('profilePictureUrl', newProfilePicUrl, 'Foto de perfil');
                toast({ title: 'Foto de Perfil Actualizada', description: 'Tu nueva foto se ha guardado.' });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        console.log("Logging out...");
        toast({ title: "Cierre de Sesión", description: "Has cerrado sesión exitosamente." });
        // Here you would typically clear session/token and redirect
        // For now, we just show a toast.
    };


    return {
        user,
        name, setName, isEditingName, setIsEditingName, handleNameChange, handleSaveName,
        email, setEmail, isEditingEmail, setIsEditingEmail, handleEmailChange, handleSaveEmail,
        selectedLevel, setSelectedLevel, isEditingLevel, setIsEditingLevel, handleLevelChange, handleSaveLevel,
        selectedGenderCategory, setSelectedGenderCategory, isEditingGenderCategory, setIsEditingGenderCategory, handleGenderCategoryChange, handleSaveGenderCategory,
        profilePicUrl, fileInputRef, handlePhotoUploadClick, handlePhotoChange,
        handleLogout,
    };
};
