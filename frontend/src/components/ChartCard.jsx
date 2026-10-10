import React from 'react';

export default function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="table-container" style={{ padding: '24px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{title}</h3>
          {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subtitle}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div style={{ flex: 1, minHeight: '280px', width: '100%' }}>
        {children}
      </div>
    </div>
  );
}
