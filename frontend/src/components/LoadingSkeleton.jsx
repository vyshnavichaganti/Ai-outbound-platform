import React from 'react';

export default function LoadingSkeleton({ rows = 4, type = 'card' }) {
  if (type === 'table') {
    return (
      <div style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)' }}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} style={{ height: '24px', background: '#F0EAE1', borderRadius: '4px', marginBottom: '16px', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ height: '140px', background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', padding: '20px' }}>
          <div style={{ width: '40%', height: '14px', background: '#F0EAE1', borderRadius: '4px', marginBottom: '16px' }} />
          <div style={{ width: '60%', height: '28px', background: '#F0EAE1', borderRadius: '4px', marginBottom: '12px' }} />
          <div style={{ width: '80%', height: '12px', background: '#F0EAE1', borderRadius: '4px' }} />
        </div>
      ))}
    </div>
  );
}
