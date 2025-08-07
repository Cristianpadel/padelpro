// src/components/layout/Header.tsx
"use client";

import React from 'react';
import Link from 'next/link';
import { PadelRacketIcon } from '../PadelRacketIcon';

interface HeaderProps {
    title: string;
    subtitle?: string;
}

const Header: React.FC<HeaderProps> = ({ title, subtitle }) => {
    return (
        <header className="p-4 md:p-6 bg-card border-b">
            <div className="flex items-center space-x-2">
                <PadelRacketIcon className="h-7 w-7 text-primary" />
                <div>
                    <h1 className="font-headline text-2xl font-bold">{title}</h1>
                    {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
                </div>
            </div>
        </header>
    );
}

export default Header;
