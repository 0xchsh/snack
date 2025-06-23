'use client';

import React from 'react';

export function ShareProfileButton({ username }: { username: string }) {
  return (
    <button
      style={{
        background: '#111',
        color: '#fff',
        border: 'none',
        borderRadius: 8,
        padding: '8px 20px',
        fontWeight: 600,
        cursor: 'pointer',
      }}
      onClick={() => navigator.clipboard.writeText(`http://localhost:3000/${username}`)}
    >
      Share profile ↗
    </button>
  );
} 