// Unified fixed match API: routes to DB when USE_DB_FIXED is enabled, else to mocks
"use client";
import { USE_DB_FIXED } from './config';
import type { Match } from '@/types';
import {
  createFixedMatchFromPlaceholder as createFixedMatchFromPlaceholderMock,
  makeMatchPublic as makeMatchPublicMock,
  fillMatchAndMakePrivate as fillMatchAndMakePrivateMock,
  confirmMatchAsPrivate as confirmMatchAsPrivateMock,
  renewRecurringMatch as renewRecurringMatchMock,
} from './mockDataSources/matches';

export const createFixedMatchFromPlaceholder = (
  organizerUserId: string,
  matchId: string,
  options: { hasReservedCourt: boolean; organizerJoins?: boolean }
): Promise<{ updatedMatch: Match; shareLink?: string } | { error: string }> =>
  USE_DB_FIXED
    ? fetch('/api/fixed-matches/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'createFromPlaceholder', payload: { organizerUserId, matchId, options } })
      }).then(r => r.json())
    : createFixedMatchFromPlaceholderMock(organizerUserId, matchId, options);

export const makeMatchPublic = (
  organizerUserId: string,
  matchId: string
): Promise<{ success: true; updatedMatch: Match } | { error: string }> =>
  USE_DB_FIXED
    ? fetch('/api/fixed-matches/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'makePublic', payload: { organizerUserId, matchId } })
      }).then(r => r.json())
    : makeMatchPublicMock(organizerUserId, matchId);

export const fillMatchAndMakePrivate = (
  userId: string,
  matchId: string
): Promise<{ updatedMatch: Match; cost: number } | { error: string }> =>
  USE_DB_FIXED
    ? fetch('/api/fixed-matches/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'fillAndMakePrivate', payload: { userId, matchId } })
      }).then(r => r.json())
    : fillMatchAndMakePrivateMock(userId, matchId);

export const confirmMatchAsPrivate = (
  organizerUserId: string,
  matchId: string,
  isRecurring: boolean
): Promise<{ updatedMatch: Match; shareLink: string } | { error: string }> =>
  USE_DB_FIXED
    ? fetch('/api/fixed-matches/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'confirmAsPrivate', payload: { organizerUserId, matchId, isRecurring } })
      }).then(r => r.json())
    : confirmMatchAsPrivateMock(organizerUserId, matchId, isRecurring);

export const renewRecurringMatch = (
  userId: string,
  completedMatchId: string
): Promise<{ success: true; newMatch: Match } | { error: string }> =>
  USE_DB_FIXED
    ? fetch('/api/fixed-matches/mutate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'renewRecurring', payload: { userId, completedMatchId } })
      }).then(r => r.json())
    : renewRecurringMatchMock(userId, completedMatchId);
