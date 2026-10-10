import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Radio, Bot, PhoneCall, Clock, Users, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LiveCalls() {
  const [activeCalls, setActiveCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActive() {
      try {
        const res = await apiClient.get('/calls/active');
        setActiveCalls(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchActive();
    const interval = setInterval(fetchActive, 3000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Wallboard Header */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
        color: '#FFF',
        padding: '24px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(201,164,92,0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
            Call Center Operations Wallboard
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#FFFDF8', marginTop: '2px' }}>
            Live Active Outbound AI Calls
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#A0A0A0' }}>Active Calls</span>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--gold-primary)' }}>{activeCalls.length}</h4>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 16px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#A0A0A0' }}>AI Agents Available</span>
            <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#28A745' }}>Priya AI</h4>
          </div>
        </div>
      </div>

      {/* Grid of Active Calls */}
      <div>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Active Voice Sessions</h3>
        {activeCalls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {activeCalls.map((call, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--gold-gradient)', color: '#111', display: 'flex', alignItems: 'center', justifyCenter: 'center' }}>
                      <Bot size={20} />
                    </div>
                    <div>
                      <strong style={{ fontSize: '15px' }}>{call.student_name}</strong>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{call.course || 'Data Science & AI'}</p>
                    </div>
                  </div>
                  <span className="status-badge connected">
                    <div className="pulse-dot"></div>
                    {call.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ background: '#FAF8F3', padding: '12px', borderRadius: 'var(--radius-md)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  <strong>Twilio SID:</strong> {call.call_sid}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Started: {call.created_at || 'Just now'}</span>
                  <a href="/dialer" className="btn btn-gold" style={{ padding: '4px 10px', fontSize: '12px' }}>
                    Open Dialer
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No Active Voice Calls"
            message="Your AI agents are currently idle. Initiate calls from the AI Dialer."
            action={<a href="/dialer" className="btn btn-gold">Go to AI Dialer</a>}
          />
        )}
      </div>
    </div>
  );
}
