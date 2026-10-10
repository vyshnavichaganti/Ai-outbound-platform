import React from 'react';
import StatusBadge from './StatusBadge';
import { Phone, Clock, Play, ChevronRight } from 'lucide-react';

export default function CallCard({ call, onClick }) {
  return (
    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onClick && onClick(call)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: '700' }}>{call.student_name}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{call.phone} • {call.date}</p>
        </div>
        <StatusBadge status={call.status} />
      </div>

      <div style={{ background: '#FAF8F3', padding: '10px 14px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
        <strong>Outcome:</strong> {call.ai_outcome || call.summary}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Clock size={13} />
          <span>{call.duration}</span>
        </div>
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }}>
          <span>View Transcript</span>
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
