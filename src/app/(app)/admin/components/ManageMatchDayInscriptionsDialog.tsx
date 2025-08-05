"use client";

import React from 'react';
import type { MatchDayEvent } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ManageMatchDayInscriptionsDialogProps {
    event: MatchDayEvent;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onEventUpdated: () => void;
}

const ManageMatchDayInscriptionsDialog: React.FC<ManageMatchDayInscriptionsDialogProps> = ({ event, isOpen, onOpenChange }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manage Inscriptions for {event.name}</DialogTitle>
                    <DialogDescription>
                        Placeholder for managing inscriptions.
                    </DialogDescription>
                </DialogHeader>
                <p className="py-4">A list of inscribed players and management options would be here.</p>
            </DialogContent>
        </Dialog>
    );
};

export default ManageMatchDayInscriptionsDialog;
