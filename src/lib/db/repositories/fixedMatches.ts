import prisma from '../../db/client'
import type { Match as AppMatch } from '@/types'

export async function fetchFixedMatches(clubId?: string): Promise<AppMatch[]> {
  const where = {
    ...(clubId ? { clubId } : {}),
    OR: [
      { type: 'FIXED' },
      { type: 'PLACEHOLDER' }
    ],
  } as const

  const matches = await prisma.match.findMany({
    where,
    include: {
      players: { include: { user: true } },
      court: true,
      organizer: true,
    },
    orderBy: { start: 'asc' },
  })

  return matches.map((m: any): AppMatch => ({
    id: m.id,
    clubId: m.clubId,
    startTime: m.start,
    endTime: m.end,
    durationMinutes: Math.max(30, Math.round((m.end.getTime() - m.start.getTime()) / 60000)),
    courtNumber: m.court?.number || undefined,
    level: (m as any).level ?? 'abierto',
    category: (m as any).category ?? 'abierta',
    status: 'forming' as const,
  bookedPlayers: (m.players || []).map((p: any): AppMatch['bookedPlayers'][number] => ({
      userId: p.userId,
      name: p.user.name || undefined,
      profilePictureUrl: p.user.profilePictureUrl || undefined,
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
  }))
}
