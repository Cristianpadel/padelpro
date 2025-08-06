"use client";

// This component is no longer used since the floating button now links to the schedule.
// Keeping the file to avoid breaking imports if it's referenced elsewhere, but returning null.

import React from 'react';

export function AiHelpModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  return null;
}
