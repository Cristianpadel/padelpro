"use client";

import React, { useEffect, useState } from 'react';

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    // Intentar cargar los datos directamente
    const loadDebugInfo = async () => {
      try {
        // Importar dinámicamente para evitar problemas de SSR
        const { getMockClubs } = await import('@/lib/mockDataSources');
        const clubs = getMockClubs();
        
        setDebugInfo({
          clubs: clubs,
          clubCount: clubs.length,
          hasWindow: typeof window !== 'undefined',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        setDebugInfo({
          error: error.message,
          hasWindow: typeof window !== 'undefined',
          timestamp: new Date().toISOString()
        });
      }
    };

    loadDebugInfo();
  }, []);

  const testLogin = (email: string, password: string) => {
    console.log('🔍 Testing login:', { email, password });
    const club = debugInfo.clubs?.find((c: any) => c.adminEmail === email);
    console.log('🎯 Found club:', club);
    
    if (club && club.adminPassword === password) {
      console.log('✅ Login should work!');
      alert('Login should work! Check console for details.');
    } else {
      console.log('❌ Login failed');
      console.log('Available clubs:', debugInfo.clubs?.map((c: any) => ({ 
        email: c.adminEmail, 
        password: c.adminPassword,
        name: c.name 
      })));
      alert('Login failed. Check console for available credentials.');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Auth Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Debug Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">System Info</h2>
          <pre className="text-sm bg-white p-3 rounded border overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Login */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Test Login</h2>
          <div className="space-y-3">
            <button 
              onClick={() => testLogin('test@test.com', '123')}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Test: test@test.com / 123
            </button>
            <button 
              onClick={() => testLogin('padelclubmallorca@hotmail.com', '1234567890')}
              className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Test: padelclubmallorca@hotmail.com / 1234567890
            </button>
            <button 
              onClick={() => testLogin('admin@padelestrella.com', 'adminpassword')}
              className="w-full bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
            >
              Test: admin@padelestrella.com / adminpassword
            </button>
          </div>
        </div>

        {/* Available Clubs */}
        {debugInfo.clubs && (
          <div className="bg-green-50 p-4 rounded-lg md:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Available Clubs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {debugInfo.clubs.map((club: any) => (
                <div key={club.id} className="bg-white p-3 rounded border">
                  <h3 className="font-bold text-lg">{club.name}</h3>
                  <p className="text-sm text-gray-600">{club.location}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-sm"><strong>Email:</strong> {club.adminEmail}</p>
                    <p className="text-sm"><strong>Password:</strong> {club.adminPassword}</p>
                  </div>
                  <button 
                    onClick={() => testLogin(club.adminEmail, club.adminPassword)}
                    className="mt-2 w-full bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
                  >
                    Test Login
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}