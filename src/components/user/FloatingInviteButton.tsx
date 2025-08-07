"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import InviteFriendDialog from './InviteFriendDialog';
import type { User } from '@/types';

interface FloatingInviteButtonProps {
    currentUser: User;
    onInviteFriend: (friendEmail: string) => void;
}

const FloatingInviteButton: React.FC<FloatingInviteButtonProps> = ({ currentUser, onInviteFriend }) => {
    const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

    return (
        <>
            <div className="fixed bottom-24 right-4 z-50 animate-bounce">
                <Button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="rounded-full h-14 w-14 bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-xl hover:scale-110 transition-transform"
                >
                    <Gift className="h-7 w-7" />
                </Button>
            </div>
            <InviteFriendDialog
                isOpen={isInviteDialogOpen}
                onOpenChange={setIsInviteDialogOpen}
                currentUser={currentUser}
                onInviteSent={onInviteFriend}
            />
        </>
    );
};

export default FloatingInviteButton;
