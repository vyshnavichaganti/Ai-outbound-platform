import React from 'react';

export default function StatusBadge({ status, type = 'status' }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase();

  let badgeClass = 'status-badge contacted';
  if (normalized.includes('new')) badgeClass = 'status-badge new';
  else if (normalized.includes('interest')) badgeClass = 'status-badge interested';
  else if (normalized.includes('qualif')) badgeClass = 'status-badge qualified';
  else if (normalized.includes('convert') || normalized.includes('complet')) badgeClass = 'status-badge converted';
  else if (normalized.includes('failed')) badgeClass = 'status-badge failed';
  else if (normalized.includes('missed') || normalized.includes('callback')) badgeClass = 'status-badge missed';
  else if (normalized.includes('connect')) badgeClass = 'status-badge connected';

  if (type === 'score') {
    if (normalized.includes('high') || Number(status) >= 80) {
      return <span className="badge-gold">High Score ({status})</span>;
    } else if (normalized.includes('med') || Number(status) >= 60) {
      return <span className="status-badge interested">Medium ({status})</span>;
    } else {
      return <span className="status-badge contacted">Low ({status})</span>;
    }
  }

  return (
    <span className={badgeClass}>
      {status}
    </span>
  );
}
