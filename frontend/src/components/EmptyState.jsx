import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No Data Found', message = 'There are no items to display at this time.', icon: Icon = Inbox, action }) {
  return (
    <div style={{
      padding: '48px 24px',
      textAlign: 'center',
      background: 'var(--bg-card)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-lg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        background: 'var(--gold-soft)',
        color: 'var(--gold-dark)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '16px'
      }}>
        <Icon size={28} />
      </div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px' }}>{title}</h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', maxWidth: '360px', marginBottom: action ? '20px' : '0' }}>{message}</p>
      {action && <div>{action}</div>}
    </div>
  );
}
