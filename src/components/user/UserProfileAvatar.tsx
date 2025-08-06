"use client";

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Camera } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { User as UserType } from '@/types';

interface UserProfileAvatarProps {
  user: UserType | null;
  profilePicUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onPhotoUploadClick: () => void;
  onPhotoChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const UserProfileAvatar: React.FC<UserProfileAvatarProps> = ({
  user,
  profilePicUrl,
  fileInputRef,
  onPhotoUploadClick,
  onPhotoChange,
}) => {
  if (!user) return null;

  const currentProfilePic = profilePicUrl || `https://randomuser.me/api/portraits/men/${user.id.slice(-2)}.jpg`;

  return (
    <div className="flex flex-col items-center space-y-2 mb-4">
      <div className="relative">
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage
            src={currentProfilePic}
            alt={`Foto de perfil de ${user.name}`}
            data-ai-hint="user profile large"
            width={96}
            height={96}
          />
          <AvatarFallback className="text-3xl bg-gray-200 text-gray-700">
            {getInitials(user.name || '')}
          </AvatarFallback>
        </Avatar>
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-0 right-0 rounded-full h-8 w-8 bg-white text-blue-500 hover:bg-gray-50 shadow-md border-gray-300"
          onClick={onPhotoUploadClick}
        >
          <Camera className="h-4 w-4" />
          <span className="sr-only">Cambiar foto de perfil</span>
        </Button>
        <Input
          id="photoInput"
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={onPhotoChange}
        />
      </div>
    </div>
  );
};

export default UserProfileAvatar;
