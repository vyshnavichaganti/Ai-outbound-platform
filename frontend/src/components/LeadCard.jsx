import React from 'react';
import StatusBadge from './StatusBadge';
import { Phone, BookOpen, GraduationCap, ChevronRight } from 'lucide-react';

export default function LeadCard({ lead, onClick, onCall }) {
  return (
    <div className="glass-card" style={{ padding: '20px', cursor: 'pointer' }} onClick={() => onClick && onClick(lead)}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: '700' }}>{lead.student_name}</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.phone}</p>
        </div>
        <StatusBadge status={lead.lead_status} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <GraduationCap size={14} style={{ color: 'var(--gold-dark)' }} />
          <span>{lead.degree} ({lead.year || 'Student'})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <BookOpen size={14} style={{ color: 'var(--gold-dark)' }} />
          <span>{lead.interest}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
        <StatusBadge status={lead.lead_score || 80} type="score" />

        <div style={{ display: 'flex', gap: '8px' }}>
          {onCall && (
            <button
              className="btn btn-gold"
              style={{ padding: '6px 12px', fontSize: '12px' }}
              onClick={(e) => { e.stopPropagation(); onCall(lead); }}
            >
              <Phone size={13} />
              <span>Call</span>
            </button>
          )}
          <button className="btn btn-outline" style={{ padding: '6px 10px' }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
