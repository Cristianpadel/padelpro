"use client";

import React from 'react';
import type { Club, Product } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ManageDealOfTheDayPanelProps {
    club: Club;
    allClubProducts: Product[];
    onSettingsUpdated: (updatedClub: Club) => void;
}

const ManageDealOfTheDayPanel: React.FC<ManageDealOfTheDayPanelProps> = ({ club, allClubProducts, onSettingsUpdated }) => {
    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle>Oferta del Día</CardTitle>
                <CardDescription>
                    Funcionalidad para gestionar la oferta del día (en desarrollo).
                </CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">Aquí se podrá seleccionar un producto como oferta del día.</p>
            </CardContent>
        </Card>
    );
};

export default ManageDealOfTheDayPanel;

    