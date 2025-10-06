"use client";

import React from 'react';
import UnifiedAdminPanel from '@/app/(app)/admin/components/UnifiedAdminPanel';

export default function SuperAdminDashboard() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <UnifiedAdminPanel currentLevel="super" />
    </div>
  );
}
