import { NextRequest, NextResponse } from 'next/server'
import { fetchFixedMatches } from '@/lib/db/repositories/fixedMatches'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const clubId = searchParams.get('clubId') || undefined
    const data = await fetchFixedMatches(clubId || undefined)
    return NextResponse.json({ data })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
