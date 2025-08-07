// src/components/schedule/InfoCard.tsx
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface InfoCardProps {
    title: string;
    description: string;
    content: React.ReactNode;
    icon?: React.ElementType;
    footerAction?: {
        label: string;
        onClick: () => void;
    };
}

const InfoCard: React.FC<InfoCardProps> = ({ title, description, content, icon: Icon, footerAction }) => {
    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{content}</div>
                <p className="text-xs text-muted-foreground">{description}</p>
            </CardContent>
            {footerAction && (
                <CardFooter>
                    <Button size="sm" onClick={footerAction.onClick}>{footerAction.label}</Button>
                </CardFooter>
            )}
        </Card>
    );
};

export default InfoCard;
