// src/app/(app)/schedule/page.tsx
"use client";

// This page has been superseded by the /dashboard page.
// The content has been moved there and this page can be removed or kept as a redirect.
// For now, it will just be an empty placeholder to avoid 404s if linked.

export default function SchedulePage() {
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold">Agenda</h1>
            <p>El contenido de la agenda se ha movido al <a href="/dashboard" className="text-blue-600 underline">Dashboard</a>.</p>
        </div>
    )
}
