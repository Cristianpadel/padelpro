// src/components/match-day/MatchDayDrawResults.tsx
"use client";

import React from 'react';
import type { Match } from '@/types';
import MatchCard from '@/components/match/MatchCard'; // Assuming a generic MatchCard can be used

interface MatchDayDrawResultsProps {
    matches: Match[];
}

const MatchDayDrawResults: React.FC<MatchDayDrawResultsProps> = ({ matches }) => {
    if (matches.length === 0) {
        return (
            <div className="text-center p-6 border-dashed border-2 rounded-lg">
                <p className="text-muted-foreground">El sorteo aún no se ha realizado o no se han generado partidas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-semibold">Partidas del Sorteo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* We can't render MatchCard here as it requires a `currentUser` prop. 
                    This component needs to be simpler or receive more props.
                    For now, a placeholder will be rendered. */}
                {matches.map(match => (
                    <div key={match.id} className="p-4 border rounded-md">
                        <p className="font-bold">Partida en Pista {match.courtNumber}</p>
                        <ul className="text-sm list-disc list-inside">
                           {(match.bookedPlayers || []).map(p => <li key={p.userId}>{p.name}</li>)}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MatchDayDrawResults;
