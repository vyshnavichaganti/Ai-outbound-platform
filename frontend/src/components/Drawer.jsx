import React from 'react';
import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>{title}</h2>
          <button onClick={onClose} style={{ color: 'var(--text-muted)' }}>
            <X size={22} />
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
