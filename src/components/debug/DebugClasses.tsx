// Componente temporal para debuggear las clases
"use client";

import { useEffect, useState } from 'react';

export default function DebugClasses() {
  const [clubs, setClubs] = useState([]);
  const [selectedClub, setSelectedClub] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        console.log('🔍 Cargando clubes...');
        const clubsResponse = await fetch('/api/clubs');
        const clubsData = await clubsResponse.json();
        console.log('🏢 Clubes encontrados:', clubsData);
        
        const estrella = clubsData.find(c => 
          c.id === 'cmftnbe2o0001tgkobtrxipip' || 
          c.name.toLowerCase().includes('estrella')
        );
        
        console.log('⭐ Club Estrella seleccionado:', estrella);
        
        if (estrella) {
          console.log('🔍 Cargando clases para', estrella.name, estrella.id);
          const classesResponse = await fetch(`/api/timeslots?clubId=${estrella.id}&date=2025-09-22`);
          const classesData = await classesResponse.json();
          console.log('📚 Clases encontradas:', classesData);
          
          setClubs(clubsData);
          setSelectedClub(estrella);
          setClasses(classesData);
        }
      } catch (error) {
        console.error('❌ Error:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div className="p-4">Cargando debug info...</div>;
  }

  return (
    <div className="p-4 bg-gray-100 rounded-lg max-w-4xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🔍 Debug de Clases</h2>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Clubes disponibles:</h3>
        <ul className="space-y-1">
          {clubs.map(club => (
            <li key={club.id} className="text-sm">
              {club.name} - ID: {club.id}
            </li>
          ))}
        </ul>
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold mb-2">Club seleccionado:</h3>
        <p className="text-sm">
          {selectedClub ? `${selectedClub.name} (${selectedClub.id})` : 'Ninguno'}
        </p>
      </div>
      
      <div>
        <h3 className="font-semibold mb-2">Clases encontradas para 22/09/2025:</h3>
        <p className="text-lg font-bold text-green-600">{classes.length} clases</p>
        {classes.length > 0 && (
          <ul className="mt-2 space-y-1">
            {classes.slice(0, 3).map(cls => (
              <li key={cls.id} className="text-sm">
                {new Date(cls.start).toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'})} - {cls.level}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}