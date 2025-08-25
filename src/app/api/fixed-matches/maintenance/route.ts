import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredProvisionalHoldsDb, ensureOpenPlaceholdersForAllProvisionalDb } from '@/lib/db/repositories/fixedMatches'

export async function POST(_req: NextRequest) {
  try {
  const purged = await purgeExpiredProvisionalHoldsDb()
  const ensured = await ensureOpenPlaceholdersForAllProvisionalDb()
  return NextResponse.json({ ...purged, ...ensured })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
