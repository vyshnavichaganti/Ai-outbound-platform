import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import { Search, Bell, Activity, Wifi, Phone, Database, Bot, AlertCircle } from 'lucide-react';

export default function Topbar({ title, subtitle }) {
  const [sysStatus, setSysStatus] = useState({
    backend_online: false,
    database_connected: false,
    twilio_connected: false,
    ai_agent_online: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await apiClient.get('/system/status');
        setSysStatus(res);
      } catch (err) {
        setSysStatus({
          backend_online: false,
          database_connected: false,
          twilio_connected: false,
          ai_agent_online: false
        });
      } finally {
        setLoading(false);
      }
    }
    checkStatus();
    const interval = setInterval(checkStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{title || 'AI Call Center'}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="topbar-actions">
        {/* Real System Status Badges */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', fontWeight: '600' }}>
          {/* Backend Online Status */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            background: sysStatus.backend_online ? '#EAF7EE' : '#FDE8E8',
            color: sysStatus.backend_online ? '#1E7E34' : '#9B2C2C',
            border: `1px solid ${sysStatus.backend_online ? '#C3E6CB' : '#F8B4B4'}`
          }}>
            <Wifi size={12} />
            <span>{sysStatus.backend_online ? 'Backend Online' : 'Backend Offline'}</span>
          </span>

          {/* Database Connected */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            background: sysStatus.database_connected ? '#EBF8FF' : '#FDE8E8',
            color: sysStatus.database_connected ? '#2B6CB0' : '#9B2C2C',
            border: `1px solid ${sysStatus.database_connected ? '#BEE3F8' : '#F8B4B4'}`
          }}>
            <Database size={12} />
            <span>{sysStatus.database_connected ? 'SQLite DB' : 'DB Offline'}</span>
          </span>

          {/* Twilio Connection */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            background: sysStatus.twilio_connected ? '#EAF7EE' : '#FFF8E6',
            color: sysStatus.twilio_connected ? '#1E7E34' : '#B7791F',
            border: `1px solid ${sysStatus.twilio_connected ? '#C3E6CB' : '#FEEBC8'}`
          }}>
            <Phone size={12} />
            <span>{sysStatus.twilio_connected ? 'Twilio Live' : 'Twilio Unconfigured'}</span>
          </span>

          {/* AI Agent Online */}
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            background: sysStatus.ai_agent_online ? 'var(--gold-soft)' : '#EDF2F7',
            color: sysStatus.ai_agent_online ? 'var(--gold-dark)' : '#4A5568',
            border: `1px solid ${sysStatus.ai_agent_online ? 'var(--gold-border)' : '#CBD5E0'}`
          }}>
            <Bot size={12} />
            <span>{sysStatus.ai_agent_online ? 'Priya AI Ready' : 'AI Offline'}</span>
          </span>
        </div>

        {/* User Profile */}
        <div className="avatar" style={{ width: '38px', height: '38px', fontSize: '14px', cursor: 'pointer' }}>
          V
        </div>
      </div>
    </header>
  );
}
