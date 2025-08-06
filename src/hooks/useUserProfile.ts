// src/hooks/useUserProfile.ts
"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getMockCurrentUser, updateUserLevel, setGlobalCurrentUser, updateUserGenderCategory } from '@/lib/mockData';
import type { User as UserType, MatchPadelLevel, UserGenderCategory } from '@/types';

export function useUserProfile(initialUser: UserType | null) {
  const [user, setUser] = useState<UserType | null>(initialUser);
  const [name, setName] = useState(initialUser?.name || '');
  const [isEditingName, setIsEditingName] = useState(false);
  const [email, setEmail] = useState(initialUser?.email || '');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<MatchPadelLevel | undefined>(initialUser?.level);
  const [isEditingLevel, setIsEditingLevel] = useState(false);
  const [selectedGenderCategory, setSelectedGenderCategory] = useState<UserGenderCategory | undefined>(initialUser?.genderCategory);
  const [isEditingGenderCategory, setIsEditingGenderCategory] = useState(false);
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

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleSaveName = useCallback(async () => {
    if (!user) return;
    setIsEditingName(false);
    setUser(prev => prev ? { ...prev, name } : null);
    const currentGlobalUser = getMockCurrentUser();
    if (currentGlobalUser && currentGlobalUser.id === user.id) {
        setGlobalCurrentUser({ ...currentGlobalUser, name });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    toast({ title: "Nombre Actualizado", description: `Tu nombre se ha cambiado a ${name}.` });
  }, [user, name, toast]);

  const handleEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(event.target.value);
  };

  const handleSaveEmail = useCallback(async () => {
    if (!user) return;
    if (!email.includes('@')) {
      toast({ title: "Error", description: "Por favor, introduce un email válido.", variant: "destructive" });
      return;
    }
    setIsEditingEmail(false);
    setUser(prev => prev ? { ...prev, email } : null);
    const currentGlobalUser = getMockCurrentUser();
    if (currentGlobalUser && currentGlobalUser.id === user.id) {
        setGlobalCurrentUser({ ...currentGlobalUser, email });
    }

    await new Promise(resolve => setTimeout(resolve, 300));
    toast({ title: "Email Actualizado", description: `Tu email se ha cambiado a ${email}.` });
  }, [user, email, toast]);

  const handleLevelChange = (value: MatchPadelLevel) => {
    setSelectedLevel(value);
  };

  const handleSaveLevel = useCallback(async () => {
    if (!user || !selectedLevel) return;
    setIsEditingLevel(false);
    const oldLevel = user.level;
    
    setUser(prev => prev ? { ...prev, level: selectedLevel } : null);
    const currentGlobalUser = getMockCurrentUser();
    if (currentGlobalUser && currentGlobalUser.id === user.id) {
        setGlobalCurrentUser({ ...currentGlobalUser, level: selectedLevel });
    }

    const result = await updateUserLevel(user.id, selectedLevel);
    if ('error' in result) {
      toast({ title: "Error al Actualizar Nivel", description: result.error, variant: "destructive" });
      setUser(prev => prev ? { ...prev, level: oldLevel } : null); // Revert optimistic update
      const currentGlobalUserForRevert = getMockCurrentUser();
      if (currentGlobalUserForRevert && currentGlobalUserForRevert.id === user.id) {
        setGlobalCurrentUser({ ...currentGlobalUserForRevert, level: oldLevel });
      }
      setSelectedLevel(oldLevel);
    } else {
      toast({ title: "Nivel Actualizado", description: `Tu nivel de juego se ha establecido a ${selectedLevel}.` });
    }
  }, [user, selectedLevel, toast]);

  const handleGenderCategoryChange = (value: UserGenderCategory) => {
    setSelectedGenderCategory(value);
  };

  const handleSaveGenderCategory = useCallback(async () => {
    if (!user || !selectedGenderCategory) return;
    setIsEditingGenderCategory(false);
    const oldGenderCategory = user.genderCategory;

    setUser(prev => prev ? { ...prev, genderCategory: selectedGenderCategory } : null);
    const currentGlobalUser = getMockCurrentUser();
    if (currentGlobalUser && currentGlobalUser.id === user.id) {
        setGlobalCurrentUser({ ...currentGlobalUser, genderCategory: selectedGenderCategory });
    }
    
    const result = await updateUserGenderCategory(user.id, selectedGenderCategory);
    if ('error' in result) {
        toast({ title: "Error al Actualizar Categoría", description: result.error, variant: "destructive" });
        setUser(prev => prev ? { ...prev, genderCategory: oldGenderCategory } : null);
        const currentGlobalUserForRevert = getMockCurrentUser();
        if (currentGlobalUserForRevert && currentGlobalUserForRevert.id === user.id) {
            setGlobalCurrentUser({ ...currentGlobalUserForRevert, genderCategory: oldGenderCategory });
        }
        setSelectedGenderCategory(oldGenderCategory);
    } else {
        toast({ title: "Categoría Actualizada", description: `Tu categoría de género se ha establecido a ${selectedGenderCategory}.` });
    }
  }, [user, selectedGenderCategory, toast]);


  const handlePhotoUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && user) {
      if (!file.type.startsWith('image/')) {
        toast({ title: "Error", description: "Por favor, selecciona un archivo de imagen.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = async () => {
        const newPhotoDataUrl = reader.result as string;
        setProfilePicUrl(newPhotoDataUrl);
        setUser(prev => prev ? { ...prev, profilePictureUrl: newPhotoDataUrl } : null);
        const currentGlobalUser = getMockCurrentUser();
        if (currentGlobalUser && currentGlobalUser.id === user.id) {
            setGlobalCurrentUser({ ...currentGlobalUser, profilePictureUrl: newPhotoDataUrl });
        }
        
        await new Promise(resolve => setTimeout(resolve, 500));
        toast({ title: "Foto Actualizada", description: "Tu foto de perfil ha sido actualizada." });
      };
      reader.readAsDataURL(file);
    }
  }, [user, toast]);

  const handleLogout = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    setGlobalCurrentUser(null); 
    setUser(null); 
    toast({ title: "Sesión Cerrada", description: "Has cerrado sesión (simulado)." });
  }, [toast]);

  return {
    user,
    name, setName, isEditingName, setIsEditingName, handleNameChange, handleSaveName,
    email, setEmail, isEditingEmail, setIsEditingEmail, handleEmailChange, handleSaveEmail,
    selectedLevel, setSelectedLevel, isEditingLevel, setIsEditingLevel, handleLevelChange, handleSaveLevel,
    selectedGenderCategory, setSelectedGenderCategory, isEditingGenderCategory, setIsEditingGenderCategory, handleGenderCategoryChange, handleSaveGenderCategory,
    profilePicUrl, fileInputRef, handlePhotoUploadClick, handlePhotoChange,
    handleLogout
  };
}
