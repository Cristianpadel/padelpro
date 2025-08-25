import prisma from '../../db/client'
import type { Match as AppMatch } from '@/types'

function mapDbMatchToApp(m: any): AppMatch {
  const status: AppMatch['status'] = m.privacy === 'PRIVATE'
    ? 'confirmed_private'
    : (m.players?.length >= 4 ? 'confirmed' : 'forming');
  return {
    id: m.id,
    clubId: m.clubId,
    startTime: m.start,
    endTime: m.end,
    durationMinutes: Math.max(30, Math.round((m.end.getTime() - m.start.getTime()) / 60000)),
    courtNumber: m.court?.number || undefined,
    level: (m as any).level ?? 'abierto',
    category: (m as any).category ?? 'abierta',
    status,
    bookedPlayers: (m.players || []).map((p: any): AppMatch['bookedPlayers'][number] => ({
      userId: p.userId,
      name: p.user?.name || undefined,
      profilePictureUrl: p.user?.profilePictureUrl || undefined,
    })),
    isPlaceholder: m.type === 'PLACEHOLDER',
    isFixedMatch: m.type !== 'NORMAL',
    fixedSchedule: undefined,
    isProvisional: !!m.provisionalExpiresAt,
    provisionalForUserId: undefined,
    provisionalExpiresAt: m.provisionalExpiresAt || undefined,
    organizerId: m.organizerId || undefined,
    privateShareCode: undefined,
    isRecurring: !!m.nextRecurringMatchId,
    nextRecurringMatchId: m.nextRecurringMatchId || undefined,
  }
}

export async function fetchFixedMatches(clubId?: string): Promise<AppMatch[]> {
  const where: any = {
    ...(clubId ? { clubId } : {}),
    OR: [
      // Show confirmed/real fixed matches
      { type: 'FIXED' },
      // And show only OPEN placeholders (no provisional hold / no organizer)
      { AND: [ { type: 'PLACEHOLDER' }, { provisionalExpiresAt: null } ] },
    ],
  }

  const matches = await prisma.match.findMany({
    where,
    include: {
      players: { include: { user: true } },
      court: true,
      organizer: true,
    },
    orderBy: { start: 'asc' },
  })

  return matches.map(mapDbMatchToApp)
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function addHours(date: Date, hours: number): Date {
  const d = new Date(date)
  d.setHours(d.getHours() + hours)
  return d
}

async function findAvailableCourtDb(clubId: string, start: Date, end: Date): Promise<{ courtId: string; number: number } | null> {
  const courts = await prisma.court.findMany({ where: { clubId }, orderBy: { number: 'asc' } })
  if (!courts.length) return null
  const overlapping = await prisma.match.findMany({
    where: {
      clubId,
      courtId: { not: null },
      start: { lt: end },
      end: { gt: start },
    },
    select: { courtId: true },
  })
  const busy = new Set(overlapping.map(o => o.courtId as string))
  const free = courts.find(c => !busy.has(c.id))
  return free ? { courtId: free.id, number: free.number } : null
}

async function ensureOpenFixedPlaceholderForSlotDb(clubId: string, slotStart: Date, slotEnd: Date) {
  // We only consider an "open" placeholder as one WITHOUT provisional hold and WITHOUT organizer
  const openExists = await prisma.match.findFirst({
    where: {
      clubId,
      type: 'PLACEHOLDER',
      start: slotStart,
      provisionalExpiresAt: null,
      organizerId: null,
    }
  })
  if (openExists) return

  // Always create an open placeholder card so the UI has something to show for booking intents
  // Even if no court is available right now, the confirmation flow will re-check availability
  await prisma.match.create({
    data: {
      clubId,
      type: 'PLACEHOLDER',
      privacy: 'PUBLIC',
      start: slotStart,
      end: slotEnd,
      provisionalExpiresAt: null,
      organizerId: null,
      courtId: null,
    },
  })
}

async function scheduleNextFixedMatchDb(baseMatchId: string) {
  const base = await prisma.match.findUnique({ where: { id: baseMatchId } })
  if (!base) return
  const baseStart = new Date(base.start)
  const baseEnd = new Date(base.end)
  const nextStart = addDays(baseStart, 7)
  const nextEnd = addDays(baseEnd, 7)
  const renewalDeadline = addHours(baseEnd, 24)

  // Create +7d provisional if none exists
  const existsNext = await prisma.match.findFirst({ where: { clubId: base.clubId, start: nextStart, provisionalExpiresAt: { not: null } } })
  let provisionalNext = existsNext
  if (!provisionalNext) {
    // Hold a court for the provisional if possible
    const heldCourt = await findAvailableCourtDb(base.clubId, nextStart, nextEnd)
    provisionalNext = await prisma.match.create({
      data: {
        clubId: base.clubId,
        type: 'PLACEHOLDER',
        privacy: 'PUBLIC',
        start: nextStart,
        end: nextEnd,
        provisionalExpiresAt: renewalDeadline,
        organizerId: base.organizerId || null,
        courtId: heldCourt?.courtId || null,
      },
    })
  }

  // Link from current to next
  await prisma.match.update({ where: { id: base.id }, data: { nextRecurringMatchId: provisionalNext.id } })

  // Ensure open placeholder for +7 slot
  await ensureOpenFixedPlaceholderForSlotDb(base.clubId, nextStart, nextEnd)

  // Create +14d provisional
  const nextStart14 = addDays(baseStart, 14)
  const nextEnd14 = addDays(baseEnd, 14)
  const renewalDeadline14 = addHours(nextEnd, 24)
  const existsNext14 = await prisma.match.findFirst({ where: { clubId: base.clubId, start: nextStart14, provisionalExpiresAt: { not: null } } })
  if (!existsNext14) {
    const heldCourt14 = await findAvailableCourtDb(base.clubId, nextStart14, nextEnd14)
    await prisma.match.create({
      data: {
        clubId: base.clubId,
        type: 'PLACEHOLDER',
        privacy: 'PUBLIC',
        start: nextStart14,
        end: nextEnd14,
        provisionalExpiresAt: renewalDeadline14,
        organizerId: base.organizerId || null,
        courtId: heldCourt14?.courtId || null,
      },
    })
  }
  await ensureOpenFixedPlaceholderForSlotDb(base.clubId, nextStart14, nextEnd14)
}

export async function createFixedMatchFromPlaceholderDb(
  organizerUserId: string,
  matchId: string,
  options: { hasReservedCourt: boolean; organizerJoins?: boolean }
): Promise<{ updatedMatch: AppMatch; shareLink?: string } | { error: string }> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { players: true }
  })
  if (!match) return { error: 'Partida no encontrada.' }
  if (match.type !== 'PLACEHOLDER') return { error: 'Solo puedes fijar partidas abiertas (placeholder).' }
  if ((match as any).players?.length > 0) return { error: 'Esta partida ya tiene jugadores.' }

  // If reserving court, assign first available
  let courtData: { courtId: string; number: number } | null = null
  if (options.hasReservedCourt) {
    courtData = await findAvailableCourtDb(match.clubId, match.start, match.end)
    if (!courtData) return { error: 'No hay pistas disponibles en este momento para confirmar la partida.' }
  }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: {
      type: 'FIXED',
      privacy: options.hasReservedCourt ? 'PRIVATE' : 'PUBLIC',
      organizerId: organizerUserId,
      provisionalExpiresAt: null,
      nextRecurringMatchId: match.nextRecurringMatchId || null,
      courtId: courtData?.courtId || null,
      players: options.organizerJoins
        ? {
            create: [{ userId: organizerUserId, isOrganizer: true }]
          }
        : undefined,
    },
    include: { players: { include: { user: true } }, court: true, organizer: true }
  })

  // Schedule next provisional holds
  await scheduleNextFixedMatchDb(updated.id)

  const app = mapDbMatchToApp(updated)
  const shareLink = app.status === 'confirmed_private' ? `/?view=partidas&code=${updated.id.slice(-6)}-${Date.now().toString().slice(-6)}` : undefined
  return { updatedMatch: app, shareLink }
}

export async function makeMatchPublicDb(
  organizerUserId: string,
  matchId: string
): Promise<{ success: true; updatedMatch: AppMatch } | { error: string }> {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'Partida no encontrada.' }
  if (match.organizerId !== organizerUserId) return { error: 'Solo el organizador puede hacer pública la partida.' }
  if (match.privacy !== 'PRIVATE') return { error: 'Esta partida ya es pública o está en otro estado.' }

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { privacy: 'PUBLIC', organizerId: null },
    include: { players: { include: { user: true } }, court: true, organizer: true }
  })
  return { success: true, updatedMatch: mapDbMatchToApp(updated) }
}

export async function fillMatchAndMakePrivateDb(
  userId: string,
  matchId: string
): Promise<{ updatedMatch: AppMatch; cost: number } | { error: string }> {
  const match = await prisma.match.findUnique({ where: { id: matchId }, include: { players: true } })
  if (!match) return { error: 'Partida no encontrada.' }
  if (match.start <= new Date()) return { error: 'No se puede confirmar una partida pasada.' }
  const court = await findAvailableCourtDb(match.clubId, match.start, match.end)
  if (!court) return { error: 'No hay pistas disponibles en este momento para confirmar la partida.' }
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { privacy: 'PRIVATE', organizerId: userId, type: 'FIXED', courtId: court.courtId, provisionalExpiresAt: null },
    include: { players: { include: { user: true } }, court: true, organizer: true }
  })
  // Schedule next provisional holds
  await scheduleNextFixedMatchDb(updated.id)
  return { updatedMatch: mapDbMatchToApp(updated), cost: 0 }
}

export async function confirmMatchAsPrivateDb(
  organizerUserId: string,
  matchId: string,
  _isRecurring: boolean
): Promise<{ updatedMatch: AppMatch; shareLink: string } | { error: string }> {
  const match = await prisma.match.findUnique({ where: { id: matchId } })
  if (!match) return { error: 'Partida no encontrada.' }
  if (match.type !== 'PLACEHOLDER') return { error: 'Solo se puede confirmar una partida placeholder.' }
  const court = await findAvailableCourtDb(match.clubId, match.start, match.end)
  if (!court) return { error: 'No hay pistas disponibles en este momento para confirmar la partida.' }
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { privacy: 'PRIVATE', organizerId: organizerUserId, type: 'FIXED', courtId: court.courtId, provisionalExpiresAt: null },
    include: { players: { include: { user: true } }, court: true, organizer: true }
  })
  await scheduleNextFixedMatchDb(updated.id)
  const app = mapDbMatchToApp(updated)
  const shareLink = `/?view=partidas&code=${updated.id.slice(-6)}-${Date.now().toString().slice(-6)}`
  return { updatedMatch: app, shareLink }
}

export async function renewRecurringMatchDb(
  userId: string,
  completedMatchId: string
): Promise<{ success: true; newMatch: AppMatch } | { error: string }> {
  const completed = await prisma.match.findUnique({ where: { id: completedMatchId } })
  if (!completed || completed.organizerId !== userId || !completed.nextRecurringMatchId) {
    return { error: 'Partida no válida para renovación.' }
  }
  const provisional = await prisma.match.findUnique({ where: { id: completed.nextRecurringMatchId } })
  if (!provisional) return { error: 'No se encontró la reserva provisional para renovar.' }
  if (provisional.provisionalExpiresAt && provisional.provisionalExpiresAt < new Date()) {
    return { error: 'El tiempo para renovar esta reserva ha expirado.' }
  }
  // Confirm provisional and assign court
  const court = await findAvailableCourtDb(provisional.clubId, provisional.start, provisional.end)
  if (!court) return { error: 'No hay pistas disponibles en este momento para confirmar la partida.' }
  const confirmed = await prisma.match.update({
    where: { id: provisional.id },
    data: { privacy: 'PRIVATE', organizerId: userId, type: 'FIXED', provisionalExpiresAt: null, courtId: court.courtId },
    include: { players: { include: { user: true } }, court: true, organizer: true }
  })
  await scheduleNextFixedMatchDb(confirmed.id)
  return { success: true, newMatch: mapDbMatchToApp(confirmed) }
}

export async function purgeExpiredProvisionalHoldsDb(): Promise<{ purged: number }> {
  const now = new Date()
  const res = await prisma.match.deleteMany({
    where: { type: 'PLACEHOLDER', provisionalExpiresAt: { lt: now } }
  })
  return { purged: res.count }
}

export async function ensureOpenPlaceholdersForAllProvisionalDb(): Promise<{ ensured: number }> {
  const provisionals = await prisma.match.findMany({
    where: { type: 'PLACEHOLDER', provisionalExpiresAt: { not: null } },
    select: { id: true, clubId: true, start: true, end: true }
  })
  let ensured = 0
  for (const p of provisionals) {
    const openExists = await prisma.match.findFirst({
      where: {
        clubId: p.clubId,
        type: 'PLACEHOLDER',
        start: p.start,
        provisionalExpiresAt: null,
        organizerId: null,
      }
    })
    if (!openExists) {
      await prisma.match.create({
        data: {
          clubId: p.clubId,
          type: 'PLACEHOLDER',
          privacy: 'PUBLIC',
          start: p.start,
          end: p.end,
          provisionalExpiresAt: null,
          organizerId: null,
          courtId: null,
        },
      })
      ensured += 1
    }
  }
  return { ensured }
}
