"use client";

import React from 'react';
import type { MatchDayEvent, PadelCourt } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface EditMatchDayEventDialogProps {
    event: MatchDayEvent;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    availableCourts: PadelCourt[];
    onEventUpdated: () => void;
}

const EditMatchDayEventDialog: React.FC<EditMatchDayEventDialogProps> = ({ event, isOpen, onOpenChange }) => {
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Match-Day Event</DialogTitle>
                    <DialogDescription>
                        Placeholder for editing event: {event.name}
                    </DialogDescription>
                </DialogHeader>
                <p className="py-4">The form to edit event details would be here.</p>
            </DialogContent>
        </Dialog>
    );
};

export default EditMatchDayEventDialog;
