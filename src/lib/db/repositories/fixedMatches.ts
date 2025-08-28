// Temporary typed helpers to satisfy TypeScript until real DB repo is implemented
import type { PadelCourt } from '@/types';

type Overlap = { courtId?: string };

export function findFreeCourt(overlapping: Overlap[], courts: Pick<PadelCourt, 'id'>[]): Pick<PadelCourt, 'id'> | undefined {
	const busy = new Set<string>(overlapping.map((o) => (o.courtId ?? '')));
	return courts.find((c) => c.id && !busy.has(c.id));
}

