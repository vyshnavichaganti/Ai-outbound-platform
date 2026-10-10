import React, { useState, useEffect } from 'react';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import apiClient from '../services/api';
import {
  PhoneCall,
  PhoneIncoming,
  Award,
  Calendar,
  Radio,
  Plus,
  Upload,
  Layers,
  Bot,
  Wifi,
  Database,
  Phone,
  Sparkles,
  ArrowRight,
  UserPlus,
  CheckCircle2
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [activeCalls, setActiveCalls] = useState([]);
  const [recentCalls, setRecentCalls] = useState([]);
  const [sysStatus, setSysStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, activeRes, callsRes, sysRes] = await Promise.all([
          apiClient.get('/dashboard/stats'),
          apiClient.get('/calls/active'),
          apiClient.get('/calls'),
          apiClient.get('/system/status')
        ]);
        setStats(statsRes);
        setActiveCalls(Array.isArray(activeRes) ? activeRes : []);
        setRecentCalls(Array.isArray(callsRes) ? callsRes : []);
        setSysStatus(sysRes);
      } catch (err) {
        console.error('Command Center load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;

  const callColumns = [
    { header: 'Student Name', accessor: 'student_name', render: (r) => <strong>{r.student_name || 'Candidate'}</strong> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status || 'completed'} /> },
    { header: 'Course Focus', accessor: 'course_recommended', render: (r) => r.course_recommended || 'Data Science & AI' },
    { header: 'Summary', accessor: 'summary', render: (r) => r.summary || 'Turn completed.' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* System Status Indicators Bar */}
      <div style={{
        background: 'linear-gradient(135deg, #111111 0%, #1A1A1A 100%)',
        color: '#FFF',
        padding: '24px 32px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(201, 164, 92, 0.3)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-gold)'
      }}>
        <div>
          <span style={{ color: 'var(--gold-primary)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '700', letterSpacing: '1px' }}>
            AI Outbound Operations Platform
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#FFFDF8', marginTop: '2px' }}>
            Call Center Command Center
          </h2>
        </div>

        {/* Real System Status Indicators */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
            <Wifi size={14} style={{ color: sysStatus?.backend_online ? '#28A745' : '#DC3545' }} />
            <span>Backend</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
            <Database size={14} style={{ color: sysStatus?.database_connected ? '#28A745' : '#DC3545' }} />
            <span>SQLite</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
            <Phone size={14} style={{ color: sysStatus?.twilio_connected ? '#28A745' : '#FFC107' }} />
            <span>Twilio</span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: 'var(--radius-full)' }}>
            <Bot size={14} style={{ color: sysStatus?.ai_agent_online ? 'var(--gold-primary)' : '#DC3545' }} />
            <span>Priya AI</span>
          </span>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '14px', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
          Quick Operational Actions
        </h3>
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
          <a href="/dialer" className="btn btn-gold">
            <PhoneCall size={16} />
            <span>Start AI Call</span>
          </a>
          <a href="/leads" className="btn btn-dark">
            <Upload size={16} />
            <span>Import Leads (CSV)</span>
          </a>
          <a href="/campaigns" className="btn btn-outline">
            <Layers size={16} />
            <span>Create Campaign</span>
          </a>
          <a href="/contacts" className="btn btn-outline">
            <UserPlus size={16} />
            <span>Add Contact</span>
          </a>
          <a href="/live-calls" className="btn btn-outline">
            <Radio size={16} />
            <span>View Live Calls ({activeCalls.length})</span>
          </a>
        </div>
      </div>

      {/* TODAY'S METRICS GRID (REAL DB VALUES ONLY) */}
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>Today's Operations Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <StatCard label="Calls Attempted" value={stats?.today_calls !== undefined ? stats.today_calls : '0'} comparisonText="DB record count" icon={PhoneCall} />
          <StatCard label="Connected Calls" value={stats?.connected_calls !== undefined ? stats.connected_calls : '0'} comparisonText="PSTN Answered" icon={PhoneIncoming} />
          <StatCard label="In Progress" value={stats?.in_progress_calls !== undefined ? stats.in_progress_calls : '0'} comparisonText="Live on line" icon={Radio} />
          <StatCard label="Completed Turns" value={stats?.completed_calls !== undefined ? stats.completed_calls : '0'} comparisonText="Successful" icon={CheckCircle2} />
          <StatCard label="Failed / No Answer" value={stats?.failed_calls !== undefined ? stats.failed_calls : '0'} isPositive={false} comparisonText="Unreachable" icon={PhoneCall} />
          <StatCard label="Qualified Leads" value={stats?.qualified_leads !== undefined ? stats.qualified_leads : '0'} comparisonText="High intent" icon={Award} />
          <StatCard label="Callbacks Requested" value={stats?.interested_leads !== undefined ? stats.interested_leads : '0'} comparisonText="Requested turn" icon={Calendar} />
        </div>
      </div>

      {/* LIVE CALL CENTER WALLBOARD SECTION */}
      <div className="table-container" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Live Call Wallboard</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Currently active PSTN calls handled by Priya AI</p>
          </div>
          <a href="/live-calls" className="btn btn-outline" style={{ fontSize: '12px' }}>
            <span>Wallboard View</span>
            <ArrowRight size={13} />
          </a>
        </div>

        {activeCalls.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {activeCalls.map((c, idx) => (
              <div key={idx} style={{ background: '#FAF8F3', padding: '18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <strong style={{ fontSize: '15px' }}>{c.student_name}</strong>
                  <span className="status-badge connected">● CONNECTED</span>
                </div>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>{c.call_sid}</p>
                <a href="/dialer" className="btn btn-gold" style={{ padding: '4px 10px', fontSize: '11.5px', width: '100%' }}>
                  OPEN IN DIALER CONTROL ROOM
                </a>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="All AI agents are currently idle"
            message="No active outbound calls in progress. Click below to start calls from the queue."
            action={<a href="/dialer" className="btn btn-gold">Launch AI Dialer</a>}
          />
        )}
      </div>

      {/* RECENT CALL HISTORY TABLE */}
      <DataTable
        title={`Recent Call History Logs (${recentCalls.length})`}
        columns={callColumns}
        data={recentCalls.slice(0, 6)}
      />
    </div>
  );
}
