"use client";

import React from 'react';
import type { Club, PadelCourt, TimeSlot } from '@/types';

const OpenMatchFormForAdmin = ({ club, clubPadelCourts, onMatchOpened }: { club: Club, clubPadelCourts: PadelCourt[], onMatchOpened: (slot: TimeSlot) => void }) => {
    return <div>Open Match Form Placeholder</div>;
}

export default OpenMatchFormForAdmin;
