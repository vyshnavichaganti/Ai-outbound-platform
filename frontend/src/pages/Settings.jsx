import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  Settings as SettingsIcon, Phone, Bot, Database, Server,
  ShieldCheck, CheckCircle2, AlertTriangle, Cpu, Volume2, Lock
} from 'lucide-react';

export default function Settings() {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await apiClient.get('/settings/info');
        setInfo(res);
      } catch (err) {
        console.error(err);
        setInfo(null);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  if (loading) return <LoadingSkeleton rows={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Platform Settings & Infrastructure Health</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
          Monitor backend runtime, database connectivity, Twilio voice gateway, Gemini LLM, and ElevenLabs TTS status.
        </p>
      </div>

      {/* Grid Settings Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Backend & Database */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Backend & Database Core</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>FastAPI Engine + SQLAlchemy ORM</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Backend Status:</span>
              <strong style={{ color: '#1E7E34' }}>{info?.backend_status || 'Online'} ({info?.backend_version})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Database Engine:</span>
              <strong>{info?.database_type || 'SQLITE'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Database Connection:</span>
              <strong style={{ color: '#1E7E34' }}>{info?.database_status || 'Connected'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Stored Candidate Leads:</span>
              <strong>{info?.database_records?.leads || 0} Records</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Stored Call Logs:</span>
              <strong>{info?.database_records?.calls || 0} Records</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>DNC Opt-Out List:</span>
              <strong>{info?.database_records?.dnc_contacts || 0} Contacts</strong>
            </div>
          </div>
        </div>

        {/* Twilio Telephony */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Phone size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Twilio Telephony Gateway</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>PSTN Voice Webhooks & Outbound Calls</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Connection Status:</span>
              <strong style={{ color: info?.twilio?.status === 'Connected' ? '#1E7E34' : '#B7791F' }}>
                {info?.twilio?.status || 'Not Configured'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Twilio Phone Number:</span>
              <strong>{info?.twilio?.phone_number || 'Not Configured'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Inbound Webhook:</span>
              <strong style={{ color: 'var(--gold-dark)' }}>/voice</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Status Callback:</span>
              <strong style={{ color: 'var(--gold-dark)' }}>/voice/status</strong>
            </div>
          </div>
        </div>

        {/* Gemini AI Counselor */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Gemini AI Counselor Core</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Conversational Intelligence Engine</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Gemini API Key:</span>
              <strong style={{ color: info?.gemini_ai?.status === 'Connected' ? '#1E7E34' : '#9B2C2C' }}>
                {info?.gemini_ai?.status || 'Not Configured'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Active Model:</span>
              <strong>{info?.gemini_ai?.model || 'Gemini 2.5 Flash'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>System Persona:</span>
              <strong>Priya AI Counselor</strong>
            </div>
          </div>
        </div>

        {/* ElevenLabs TTS Engine */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'var(--gold-soft)', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Volume2 size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700' }}>ElevenLabs Speech Synthesis</h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Low-latency Voice Generation</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>ElevenLabs Status:</span>
              <strong style={{ color: info?.elevenlabs?.status === 'Connected' ? '#1E7E34' : '#B7791F' }}>
                {info?.elevenlabs?.status || 'Fallback (Twilio TTS)'}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Target Voice Persona:</span>
              <strong>{info?.elevenlabs?.voice || 'Priya (English-IN)'}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Fallback TTS:</span>
              <strong>Twilio Say (Alice)</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Compliance Banner */}
      <div className="glass-card" style={{ padding: '24px', background: '#111', color: '#FFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <Lock size={20} style={{ color: 'var(--gold-primary)' }} />
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#FFF' }}>Security & Privacy Protections</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#CCC', lineHeight: '1.5', margin: 0 }}>
          Private API keys (`GEMINI_API_KEY`, `TWILIO_AUTH_TOKEN`, `ELEVENLABS_API_KEY`) are protected in environment variables and never exposed to front-end clients. Do Not Call (DNC) rules strictly prevent dialing opted-out candidate phone numbers across all campaign and queue turns.
        </p>
      </div>
    </div>
  );
}
