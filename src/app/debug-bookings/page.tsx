// src/app/debug-bookings/page.tsx
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getBookingsData() {
  const timeSlots = await prisma.timeSlot.findMany({
    where: { 
      start: { gte: new Date('2025-09-11T00:00:00.000Z') },
      start: { lt: new Date('2025-09-12T00:00:00.000Z') }
    },
    include: {
      bookings: {
        include: { 
          user: { 
            select: { 
              id: true, 
              name: true, 
              email: true 
            } 
          } 
        }
      },
      instructor: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: { start: 'asc' }
  });

  return timeSlots;
}

async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });
  return users;
}

export default async function DebugBookingsPage() {
  const timeSlots = await getBookingsData();
  const users = await getAllUsers();

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">🔍 Debug - Estado de la Base de Datos</h1>
      
      {/* Usuarios */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">👥 Usuarios en el Sistema</h2>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="grid gap-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{user.name}</span>
                  <span className="text-gray-500 ml-2">({user.email})</span>
                </div>
                <div className="text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {user.role}
                  </span>
                  <span className="ml-2 text-gray-600 font-mono text-xs">{user.id}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Clases y Reservas */}
      <div>
        <h2 className="text-xl font-semibold mb-4">📅 Clases del 11 de Septiembre 2025</h2>
        <div className="space-y-4">
          {timeSlots.map(slot => {
            const startTime = new Date(slot.start).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const endTime = new Date(slot.end).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit' 
            });
            const available = slot.maxPlayers - slot.bookings.length;
            const hasUserTest = slot.bookings.some(b => b.userId === 'user-alex-test');

            return (
              <div key={slot.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {startTime} - {endTime}
                    </h3>
                    <p className="text-gray-600">
                      Instructor: {slot.instructor?.name || 'No asignado'}
                    </p>
                    <p className="text-xs text-gray-500 font-mono">{slot.id}</p>
                  </div>
                  <div className="text-right">
                    <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                      available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {available} / {slot.maxPlayers} disponibles
                    </div>
                    {hasUserTest && (
                      <div className="mt-1">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          Ya reservado por user-alex-test
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {slot.bookings.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 text-gray-700">
                      Reservas actuales ({slot.bookings.length}):
                    </h4>
                    <div className="space-y-1">
                      {slot.bookings.map(booking => (
                        <div key={booking.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                          <div>
                            <span className="font-medium">{booking.user.name}</span>
                            <span className="text-gray-500 ml-2">({booking.user.email})</span>
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="font-mono">{booking.user.id}</span>
                            <span className="ml-2">
                              {new Date(booking.createdAt).toLocaleString('es-ES')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {slot.bookings.length === 0 && (
                  <div className="text-gray-500 text-sm italic">
                    No hay reservas para esta clase
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">💡 Información para Debug</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• <strong>user-alex-test</strong> es el usuario que se usa por defecto en el frontend</li>
          <li>• Si una clase muestra "Ya reservado por user-alex-test", NO podrás reservar nuevamente</li>
          <li>• Puedes reservar solo las clases que NO tengan esta etiqueta</li>
          <li>• Cada clase permite máximo {timeSlots[0]?.maxPlayers || 4} jugadores</li>
        </ul>
      </div>
    </div>
  );
}
