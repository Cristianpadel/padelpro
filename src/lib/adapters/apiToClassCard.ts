// src/lib/adapters/apiToClassCard.ts
import type { TimeSlot as ApiTimeSlot } from '@/lib/classesApi';
import type { TimeSlot, Instructor, Club, User, ClassPadelLevel, PadelCategoryForSlot } from '@/types';
import { 
  getMockClubs, 
  getMockInstructors, 
  initializeMockClubs, 
  initializeMockInstructors 
} from '@/lib/mockData';

/**
 * Convierte los datos de la API al formato que espera ClassCard
 */
export function adaptApiTimeSlotToClassCard(apiSlot: ApiTimeSlot): TimeSlot {
  // Generar un instructor mock basado en los datos de la API
  const instructorId = apiSlot.instructorId || `instructor-${apiSlot.id.substring(0, 8)}`;
  
  // Convertir el nivel de string a ClassPadelLevel
  const convertLevel = (level?: string): ClassPadelLevel => {
    if (!level) return 'abierto';
    
    // Para niveles específicos, crear un rango
    const levelMap: Record<string, ClassPadelLevel> = {
      'Principiante': { min: '1.0', max: '2.5' },
      'Intermedio': { min: '3.0', max: '4.5' },
      'Avanzado': { min: '5.0', max: '7.0' },
      'Competición': { min: '6.0', max: '7.0' },
    };
    return levelMap[level] || 'abierto';
  };

  // Convertir la categoría
  const convertCategory = (category?: string): PadelCategoryForSlot => {
    const categoryMap: Record<string, PadelCategoryForSlot> = {
      'Mixto': 'abierta',
      'Femenino': 'chica',
      'Masculino': 'chico',
    };
    return categoryMap[category || ''] || 'abierta';
  };

  return {
    id: apiSlot.id,
    clubId: apiSlot.clubId,
    instructorId: instructorId,
    instructorName: apiSlot.instructorName || 'Instructor',
    startTime: new Date(apiSlot.start),
    endTime: new Date(apiSlot.end),
    durationMinutes: 90, // Valor estándar
    level: convertLevel(apiSlot.level),
    category: convertCategory(apiSlot.category),
    maxPlayers: apiSlot.maxPlayers || 4,
    status: 'forming' as const,
    
    // IMPORTANTE: No creamos bookedPlayers ficticios aquí
    // El campo apiSlot.bookedPlayers es solo un contador numérico
    // Las reservas reales se gestionan a través de la API /api/classes/book
    // y se sincronizan cuando se hacen reservas exitosas
    bookedPlayers: [],
    
    // Campos opcionales
    courtNumber: apiSlot.courtNumber,
    totalPrice: apiSlot.totalPrice,
    
    // Campos que pueden ser null/undefined
    designatedGratisSpotPlaceholderIndexForOption: undefined,
    privateShareCode: undefined,
  };
}

/**
 * Crea un instructor mock basado en los datos de la API
 */
export function createMockInstructorFromApi(apiSlot: ApiTimeSlot): Instructor {
  return {
    id: apiSlot.instructorId || `instructor-${apiSlot.id.substring(0, 8)}`,
    name: apiSlot.instructorName || 'Instructor',
    email: `instructor@padelpro.com`,
    level: '4.0',
    profilePictureUrl: apiSlot.instructorProfilePicture || undefined,
    isAvailable: true,
    defaultRatePerHour: apiSlot.totalPrice ? Math.floor((apiSlot.totalPrice || 0) * 0.6) : 20,
    experience: ['5+ años de experiencia'],
    languages: ['Español'],
    assignedClubId: apiSlot.clubId,
  };
}

/**
 * Crea un club mock para el ClassCard
 */
export function createMockClubFromApi(clubId: string): Club {
  return {
    id: clubId,
    name: 'Club Pádel Pro',
    location: 'Calle Principal 123, Ciudad',
    logoUrl: undefined,
    showClassesTabOnFrontend: true,
    showMatchesTabOnFrontend: true,
    isMatchDayEnabled: false,
    isMatchProEnabled: false,
    isStoreEnabled: false,
    // Efectos visuales para las tarjetas
    cardShadowEffect: {
      enabled: true,
      color: '#3B82F6', // blue-500
      intensity: 0.3,
    },
  };
}

/**
 * Registra instructor y club en el sistema mock si no existen
 */
export function registerMockDataForApi(instructor: Instructor, club: Club) {
  try {
    // Obtener datos mock actuales
    const currentInstructors = getMockInstructors() || [];
    const currentClubs = getMockClubs() || [];

    // Verificar si el instructor ya existe
    const instructorExists = currentInstructors.some(i => i.id === instructor.id);
    if (!instructorExists) {
      console.log('🔄 Registrando instructor mock:', instructor.id, instructor.name);
      initializeMockInstructors([...currentInstructors, instructor]);
    }

    // Verificar si el club ya existe
    const clubExists = currentClubs.some(c => c.id === club.id);
    if (!clubExists) {
      console.log('🔄 Registrando club mock:', club.id, club.name);
      initializeMockClubs([...currentClubs, club]);
    }
  } catch (error) {
    console.warn('⚠️ No se pudieron registrar datos mock:', error);
  }
}

/**
 * Función principal que convierte un ApiTimeSlot en todos los datos necesarios para ClassCard
 */
export function adaptApiDataForClassCard(apiSlot: ApiTimeSlot) {
  const timeSlot = adaptApiTimeSlotToClassCard(apiSlot);
  const instructor = createMockInstructorFromApi(apiSlot);
  const club = createMockClubFromApi(apiSlot.clubId);

  // Registrar en el sistema mock para que ClassCard pueda encontrarlos
  registerMockDataForApi(instructor, club);

  return {
    timeSlot,
    instructor,
    club,
  };
}