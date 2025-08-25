import { NextRequest, NextResponse } from 'next/server'
import { createFixedMatchFromPlaceholderDb, makeMatchPublicDb, fillMatchAndMakePrivateDb, confirmMatchAsPrivateDb, renewRecurringMatchDb } from '@/lib/db/repositories/fixedMatches'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, payload } = body || {}
    switch (action) {
      case 'createFromPlaceholder': {
        const { organizerUserId, matchId, options } = payload || {}
        const res = await createFixedMatchFromPlaceholderDb(organizerUserId, matchId, options)
        return NextResponse.json(res)
      }
      case 'makePublic': {
        const { organizerUserId, matchId } = payload || {}
        const res = await makeMatchPublicDb(organizerUserId, matchId)
        return NextResponse.json(res)
      }
      case 'fillAndMakePrivate': {
        const { userId, matchId } = payload || {}
        const res = await fillMatchAndMakePrivateDb(userId, matchId)
        return NextResponse.json(res)
      }
      case 'confirmAsPrivate': {
        const { organizerUserId, matchId, isRecurring } = payload || {}
        const res = await confirmMatchAsPrivateDb(organizerUserId, matchId, !!isRecurring)
        return NextResponse.json(res)
      }
      case 'renewRecurring': {
        const { userId, completedMatchId } = payload || {}
        const res = await renewRecurringMatchDb(userId, completedMatchId)
        return NextResponse.json(res)
      }
      default:
        return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
