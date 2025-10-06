"use client";

import React, { useState, useEffect, useTransition } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Building, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  MapPin, 
  Mail, 
  Phone, 
  Key,
  Users,
  Activity
} from 'lucide-react';
import { getMockClubs } from '@/lib/mockData';
import type { Club } from '@/types';
import { v4 as uuidv4 } from 'uuid';

interface ClubFormData {
  name: string;
  location: string;
  adminEmail: string;
  adminPassword: string;
  phone: string;
  isActive: boolean;
}

export default function ClubsManagement() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const [formData, setFormData] = useState<ClubFormData>({
    name: '',
    location: '',
    adminEmail: '',
    adminPassword: '',
    phone: '',
    isActive: true
  });

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      const clubsData = await getMockClubs();
      setClubs(clubsData);
    } catch (error) {
      console.error('Error loading clubs:', error);
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los clubes',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      location: '',
      adminEmail: '',
      adminPassword: '',
      phone: '',
      isActive: true
    });
  };

  const handleCreate = () => {
    startTransition(async () => {
      try {
        const newClub: Club = {
          id: `club-${uuidv4()}`,
          name: formData.name,
          location: formData.location,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          phone: formData.phone,
          isActive: formData.isActive,
          logoUrl: 'https://placehold.co/80x80.png?text=' + encodeURIComponent(formData.name.substring(0, 2).toUpperCase()),
          showClassesTabOnFrontend: true,
          showMatchesTabOnFrontend: true,
          isMatchDayEnabled: true,
          isMatchProEnabled: false,
          isStoreEnabled: false,
          pointSettings: {
            earningsPerClass: 10,
            earningsPerMatch: 5,
            penaltyPerCancellation: 5,
            loyaltyPointValue: 0.01,
            minimumPointsForBooking: 100
          },
          levelRanges: [
            { name: "Iniciación", min: '1.0' as any, max: '2.0' as any, color: 'hsl(142.1 76.2% 36.3%)' },
            { name: "Intermedio", min: '2.5' as any, max: '3.5' as any, color: 'hsl(210 100% 56%)' },
            { name: "Avanzado", min: '4.0' as any, max: '5.5' as any, color: 'hsl(24.6 95% 53.1%)' },
            { name: "Competición", min: '6.0' as any, max: '7.0' as any, color: 'hsl(346.8 77.2% 49.8%)' },
          ],
          courtRateTiers: [],
          pointBookingSlots: {
            saturday: [],
            sunday: []
          }
        };

        // En un escenario real, aquí llamarías a una API
        setClubs(prev => [...prev, newClub]);
        
        toast({
          title: 'Club creado',
          description: `El club "${formData.name}" ha sido creado exitosamente.`,
        });

        setIsCreateDialogOpen(false);
        resetForm();
      } catch (error) {
        console.error('Error creating club:', error);
        toast({
          title: 'Error',
          description: 'No se pudo crear el club',
          variant: 'destructive'
        });
      }
    });
  };

  const handleEdit = (club: Club) => {
    setEditingClub(club);
    setFormData({
      name: club.name,
      location: club.location,
      adminEmail: club.adminEmail || '',
      adminPassword: club.adminPassword || '',
      phone: club.phone || '',
      isActive: club.isActive !== false
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingClub) return;

    startTransition(async () => {
      try {
        const updatedClub: Club = {
          ...editingClub,
          name: formData.name,
          location: formData.location,
          adminEmail: formData.adminEmail,
          adminPassword: formData.adminPassword,
          phone: formData.phone,
          isActive: formData.isActive
        };

        setClubs(prev => prev.map(club => 
          club.id === editingClub.id ? updatedClub : club
        ));

        toast({
          title: 'Club actualizado',
          description: `El club "${formData.name}" ha sido actualizado exitosamente.`,
        });

        setIsEditDialogOpen(false);
        setEditingClub(null);
        resetForm();
      } catch (error) {
        console.error('Error updating club:', error);
        toast({
          title: 'Error',
          description: 'No se pudo actualizar el club',
          variant: 'destructive'
        });
      }
    });
  };

  const handleDelete = (club: Club) => {
    if (confirm(`¿Estás seguro de que quieres eliminar el club "${club.name}"?`)) {
      setClubs(prev => prev.filter(c => c.id !== club.id));
      toast({
        title: 'Club eliminado',
        description: `El club "${club.name}" ha sido eliminado.`,
      });
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (club.adminEmail && club.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestión de Clubes</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Administra todos los clubes de la plataforma
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Club
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Club</DialogTitle>
              <DialogDescription>
                Añade un nuevo club a la plataforma PadelPro
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nombre del Club</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Padel Club Madrid"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Dirección</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  placeholder="Ej: Madrid, España"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminEmail">Email Administrador</Label>
                <Input
                  id="adminEmail"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                  placeholder="admin@club.com"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adminPassword">Contraseña</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
                  placeholder="Contraseña del administrador"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="Ej: +34 123 456 789"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label htmlFor="isActive">Club activo</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={isPending}>
                {isPending ? 'Creando...' : 'Crear Club'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clubes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Clubs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Clubes ({filteredClubs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableCaption>
              Lista de todos los clubes registrados en la plataforma
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Club</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Email Admin</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClubs.map((club) => (
                <TableRow key={club.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Building className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{club.name}</p>
                        <p className="text-sm text-muted-foreground">ID: {club.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      {club.location}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {club.adminEmail || 'No configurado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {club.phone || 'No configurado'}
                    </div>
                  </TableCell>
                  <TableCell>
                    {club.isActive !== false ? (
                      <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                        <Activity className="h-3 w-3 mr-1" />
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-red-100 text-red-800">
                        Inactivo
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(club)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(club)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Editar Club</DialogTitle>
            <DialogDescription>
              Modifica los datos del club seleccionado
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Nombre del Club</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-location">Dirección</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-adminEmail">Email Administrador</Label>
              <Input
                id="edit-adminEmail"
                type="email"
                value={formData.adminEmail}
                onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-adminPassword">Contraseña</Label>
              <Input
                id="edit-adminPassword"
                type="password"
                value={formData.adminPassword}
                onChange={(e) => setFormData({...formData, adminPassword: e.target.value})}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Teléfono</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label htmlFor="edit-isActive">Club activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdate} disabled={isPending}>
              {isPending ? 'Actualizando...' : 'Actualizar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}