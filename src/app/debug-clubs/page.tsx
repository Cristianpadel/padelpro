"use client";

import React, { useEffect, useState } from 'react';
import { getMockClubs } from '@/lib/mockDataSources';
import type { Club } from '@/types';

export default function DebugClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);

  useEffect(() => {
    const allClubs = getMockClubs();
    setClubs(allClubs);
    console.log('Clubs cargados:', allClubs);
  }, []);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Clubs Cargados</h1>
      <div className="space-y-4">
        {clubs.map(club => (
          <div key={club.id} className="border p-4 rounded">
            <h3 className="font-bold">{club.name}</h3>
            <p><strong>ID:</strong> {club.id}</p>
            <p><strong>Email:</strong> {club.adminEmail}</p>
            <p><strong>Password:</strong> {club.adminPassword}</p>
            <p><strong>Location:</strong> {club.location}</p>
          </div>
        ))}
      </div>
    </div>
  );
}