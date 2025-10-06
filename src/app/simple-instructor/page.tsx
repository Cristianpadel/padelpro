'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  CalendarCheck,
  CheckSquare,
  CreditCard,
  Play,
  Settings2,
  ToggleLeft,
  Euro,
  Save,
  Calendar
} from 'lucide-react';

export default function SimpleInstructorPanel() {
  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">👨‍🏫 Panel de Instructor Simplificado</h1>
        <p className="text-gray-600">Versión de prueba con las nuevas funcionalidades</p>
      </div>

      <Tabs defaultValue="manageClasses" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 h-auto p-1 bg-gray-100 gap-1 flex-wrap">
          <TabsTrigger 
            value="manageClasses"
            className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            📚 Gestionar Clases
          </TabsTrigger>
          <TabsTrigger 
            value="addCredits"
            className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            💳 Añadir Crédito
          </TabsTrigger>
          <TabsTrigger 
            value="openMatch"
            className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            🏓 Abrir Partida
          </TabsTrigger>
          <TabsTrigger 
            value="instructorPreferences"
            className="text-xs sm:text-sm py-2 px-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
          >
            ⚙️ Preferencias y Tarifas
          </TabsTrigger>
          
          <Button
            asChild
            variant="ghost"
            className="text-xs sm:text-sm py-2 px-2 h-auto text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          >
            <a href="/club-calendar/club-1" target="_blank" rel="noopener noreferrer">
              <Calendar className="mr-1 h-4 w-4"/>
              📅 Calendario Club
            </a>
          </Button>
        </TabsList>

        {/* Gestionar Clases */}
        <TabsContent value="manageClasses" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <CalendarCheck className="mr-2 h-5 w-5 text-primary" /> 
                    Añadir Nueva Clase
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="classDate">Fecha</Label>
                      <input
                        id="classDate"
                        type="date"
                        className="w-full p-2 border rounded"
                        defaultValue={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div>
                      <Label htmlFor="classTime">Hora de Inicio</Label>
                      <select id="classTime" className="w-full p-2 border rounded">
                        <option value="09:00">09:00</option>
                        <option value="10:00">10:00</option>
                        <option value="11:00">11:00</option>
                        <option value="12:00">12:00</option>
                        <option value="15:00">15:00</option>
                        <option value="16:00">16:00</option>
                        <option value="17:00">17:00</option>
                        <option value="18:00">18:00</option>
                        <option value="19:00">19:00</option>
                        <option value="20:00">20:00</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="classClub">Club</Label>
                      <select id="classClub" className="w-full p-2 border rounded">
                        <option value="club-1">Padel Club Central</option>
                        <option value="club-padel-estrella">Padel Estrella</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="classCourt">Número de Pista</Label>
                      <select id="classCourt" className="w-full p-2 border rounded">
                        <option value="1">Pista 1</option>
                        <option value="2">Pista 2</option>
                        <option value="3">Pista 3</option>
                      </select>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        id="openClass"
                        type="checkbox"
                        defaultChecked
                        className="rounded"
                      />
                      <Label htmlFor="openClass">Nivel Abierto</Label>
                    </div>
                    <div>
                      <Label htmlFor="classCategory">Categoría de la Clase</Label>
                      <select id="classCategory" className="w-full p-2 border rounded">
                        <option value="Abierta (Mixto)">Abierta (Mixto)</option>
                        <option value="Solo Hombres">Solo Hombres</option>
                        <option value="Solo Mujeres">Solo Mujeres</option>
                        <option value="Torneo">Torneo</option>
                      </select>
                    </div>
                    <Button className="w-full">
                      <CalendarCheck className="mr-2 h-4 w-4" />
                      Crear Clase
                    </Button>
                    <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                      Cancelar Clase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary" /> 
                    Clases Gestionadas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg mb-2">📅 Vista de calendario</p>
                    <p>Aquí aparecerían las clases programadas en formato calendario</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Añadir Crédito */}
        <TabsContent value="addCredits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <CreditCard className="mr-2 h-5 w-5 text-primary" /> 
                Añadir Crédito a Alumnos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="creditUser">Seleccionar Usuario</Label>
                  <select id="creditUser" className="w-full p-2 border rounded">
                    <option value="">Seleccionar usuario...</option>
                    <option value="user1">Alex García (alex@test.com)</option>
                    <option value="user2">María Instructor (maria@test.com)</option>
                    <option value="user3">Carlos Instructor (carlos@test.com)</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="creditAmount">Cantidad de Crédito (€)</Label>
                  <input
                    id="creditAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    placeholder="25.00"
                  />
                </div>
                <div>
                  <Label htmlFor="creditConcept">Concepto</Label>
                  <input
                    id="creditConcept"
                    type="text"
                    className="w-full p-2 border rounded"
                    placeholder="Recarga de saldo"
                  />
                </div>
                <Button className="w-full">
                  <Euro className="mr-2 h-4 w-4" />
                  Añadir Crédito
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abrir Partida */}
        <TabsContent value="openMatch" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Play className="mr-2 h-5 w-5 text-primary" /> 
                Abrir Nueva Partida
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-md">
                <div>
                  <Label htmlFor="matchDate">Fecha de la Partida</Label>
                  <input
                    id="matchDate"
                    type="date"
                    className="w-full p-2 border rounded"
                    defaultValue={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="matchTime">Hora</Label>
                  <select id="matchTime" className="w-full p-2 border rounded">
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                    <option value="18:00">18:00</option>
                    <option value="19:00">19:00</option>
                    <option value="20:00">20:00</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="matchClub">Club</Label>
                  <select id="matchClub" className="w-full p-2 border rounded">
                    <option value="club-1">Padel Club Central</option>
                    <option value="club-padel-estrella">Padel Estrella</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="matchCourt">Pista</Label>
                  <select id="matchCourt" className="w-full p-2 border rounded">
                    <option value="1">Pista 1</option>
                    <option value="2">Pista 2</option>
                    <option value="3">Pista 3</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="matchPrice">Precio por Jugador (€)</Label>
                  <input
                    id="matchPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    className="w-full p-2 border rounded"
                    placeholder="12.50"
                  />
                </div>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Crear Partida Abierta
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferencias y Tarifas */}
        <TabsContent value="instructorPreferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings2 className="mr-2 h-5 w-5 text-primary" />
                Preferencias y Tarifas
              </CardTitle>
              <CardDescription>
                Configura tu club de operación, disponibilidad general y tarifas por hora.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <Label htmlFor="instructorClub">Club de Operación Principal</Label>
                  <select id="instructorClub" className="w-full p-2 border rounded">
                    <option value="">Selecciona tu club principal</option>
                    <option value="club-1">Padel Club Central</option>
                    <option value="club-padel-estrella">Padel Estrella</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="assignedCourt">Pista Asignada (opcional)</Label>
                  <select id="assignedCourt" className="w-full p-2 border rounded">
                    <option value="">Ninguna (flotante)</option>
                    <option value="1">Pista 1</option>
                    <option value="2">Pista 2</option>
                    <option value="3">Pista 3</option>
                  </select>
                </div>

                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <Label className="flex items-center">
                      <ToggleLeft className="mr-2 h-5 w-5 text-green-600"/>
                      Disponibilidad General
                    </Label>
                    <div className="text-xs text-gray-500">
                      Estás disponible para dar clases.
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="space-y-4 rounded-lg border p-3 shadow-sm">
                  <div>
                    <Label htmlFor="defaultRate" className="flex items-center">
                      <Euro className="mr-2 h-4 w-4 text-gray-400"/>
                      Tarifa por Hora Predeterminada
                    </Label>
                    <input
                      id="defaultRate"
                      type="number"
                      min="0"
                      step="1"
                      className="w-full p-2 border rounded"
                      defaultValue="28"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Esta tarifa se usará si la clase no cae en ninguna franja de tarifa especial.
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Horario de Disponibilidad</Label>
                  <div className="text-xs text-gray-500 mb-2">
                    Define los bloques horarios en los que SÍ estarás disponible para dar clases.
                  </div>
                  <div className="text-center py-4 text-gray-400 border rounded">
                    Configuración de disponibilidad en desarrollo...
                  </div>
                </div>

                <Button className="w-full sm:w-auto">
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Preferencias y Tarifas
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}