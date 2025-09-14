'use client';

import { useState, useEffect } from 'react';

interface ClassData {
  id: string;
  start: string;
  instructorName: string;
  level?: string;
  bookedPlayers: number;
  maxPlayers: number;
}

export default function SimpleBookingPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/timeslots?clubId=club-1&date=2025-09-11');
      const data = await response.json();
      setClasses(data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async (classId: string) => {
    setBooking(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/classes/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeSlotId: classId,
          userId: 'user-alex-test'
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setMessage(`✅ ¡Reserva exitosa! ${result.message}`);
        fetchClasses(); // Refresh classes
      } else {
        setMessage(`❌ Error: ${result.message}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setMessage(`❌ Error: ${errorMessage}`);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div className="p-4">Cargando clases...</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Reservar Clases - Simple</h1>
      
      {message && (
        <div className={`p-4 mb-4 rounded ${message.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <div className="grid gap-4">
        {classes.map((cls) => {
          const startTime = new Date(cls.start).toLocaleTimeString('es-ES', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          return (
            <div key={cls.id} className="border rounded p-4 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold">{startTime} - {cls.instructorName}</h3>
                  <p className="text-gray-600">Nivel: {cls.level || 'abierto'}</p>
                  <p className="text-sm text-gray-500">
                    Reservas: {cls.bookedPlayers}/{cls.maxPlayers}
                  </p>
                </div>
                
                <button
                  onClick={() => handleBooking(cls.id)}
                  disabled={booking || cls.bookedPlayers >= cls.maxPlayers}
                  className={`px-4 py-2 rounded font-medium ${
                    cls.bookedPlayers >= cls.maxPlayers
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : booking
                      ? 'bg-blue-300 text-blue-700'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {booking ? 'Reservando...' : 
                   cls.bookedPlayers >= cls.maxPlayers ? 'Completa' : 'Reservar'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
