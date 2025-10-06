'use client';

import React from 'react';

export default function TestBuild() {
  return (
    <div key="test" className="min-h-screen bg-gray-50" suppressHydrationWarning>
      <div className="container mx-auto px-4 py-6">
        <h1>Test Build</h1>
      </div>
    </div>
  );
}