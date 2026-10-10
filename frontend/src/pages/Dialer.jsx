import React, { useState, useEffect, useRef } from 'react';
import apiClient from '../services/api';
import StatusBadge from '../components/StatusBadge';
import AIMessage from '../components/AIMessage';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Pause,
  Play,
  FileText,
  Sparkles,
  Bot,
  User,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Radio,
  Clock,
  ArrowRight,
  Send
} from 'lucide-react';

export default function Dialer() {
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);

  // Active Call State
  const [callState, setCallState] = useState('IDLE'); // IDLE, QUEUED, RINGING, CONNECTED, COMPLETED, FAILED
  const [isInitiating, setIsInitiating] = useState(false);
  const [activeCallSid, setActiveCallSid] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callError, setCallError] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isOnHold, setIsOnHold] = useState(false);

  // Transcript & Insights
  const [transcript, setTranscript] = useState([]);
  const [aiTurnState, setAiTurnState] = useState('Idle'); // Idle, Speaking, Listening, Thinking
  const [simText, setSimText] = useState('');

  const chatBottomRef = useRef(null);

  // Load leads from backend
  useEffect(() => {
    async function loadLeads() {
      try {
        const data = await apiClient.get('/leads');
        const list = Array.isArray(data) ? data : [];
        setLeads(list);
        setFilteredLeads(list);
        if (list.length > 0) {
          setSelectedLead(list[0]);
        }
      } catch (err) {
        console.error('Failed loading leads:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLeads();
  }, []);

  // Filter queue
  useEffect(() => {
    if (!searchQuery) {
      setFilteredLeads(leads);
    } else {
      const q = searchQuery.toLowerCase();
      setFilteredLeads(leads.filter(l =>
        l.student_name.toLowerCase().includes(q) ||
        (l.interest && l.interest.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q))
      ));
    }
  }, [searchQuery, leads]);

  // Duration Timer
  useEffect(() => {
    let timer;
    if (callState === 'CONNECTED' || callState === 'RINGING') {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [callState]);

  // Auto Polling for Active Call Status
  useEffect(() => {
    let pollTimer;
    if (activeCallSid && (callState === 'QUEUED' || callState === 'RINGING' || callState === 'CONNECTED')) {
      pollTimer = setInterval(async () => {
        try {
          const statusRes = await apiClient.get(`/calls/status/${activeCallSid}`);
          if (statusRes.status === 'completed') {
            setCallState('COMPLETED');
            setAiTurnState('Idle');
          } else if (statusRes.status === 'failed' || statusRes.status === 'busy' || statusRes.status === 'no-answer') {
            setCallState('FAILED');
            setCallError(`Call outcome: ${statusRes.status}`);
          } else if (statusRes.status === 'in-progress' || statusRes.status === 'answered') {
            setCallState('CONNECTED');
          }
        } catch (e) {
          console.warn('Status poll failed', e);
        }
      }, 2000);
    }
    return () => clearInterval(pollTimer);
  }, [activeCallSid, callState]);

  // Scroll transcript
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript, aiTurnState]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const normalizePhoneNumber = (phone) => {
    if (!phone) return '';
    let cleaned = phone.toString().trim().replace(/[\s\-\(\)]/g, '');
    if (!cleaned.startsWith('+')) {
      if (cleaned.length === 10) {
        cleaned = `+91${cleaned}`;
      } else {
        cleaned = `+${cleaned}`;
      }
    }
    return cleaned;
  };

  const handleSelectLead = (lead) => {
    if (isInitiating) return;
    setSelectedLead(lead);
    setCallError(null);
    if (callState === 'COMPLETED' || callState === 'FAILED') {
      setCallState('IDLE');
      setAiTurnState('Idle');
      setActiveCallSid(null);
    }
  };

  // Trigger REAL Twilio Call
  const handleStartCall = async (leadToCall = selectedLead) => {
    if (!leadToCall || isInitiating) return;
    const targetPhone = normalizePhoneNumber(leadToCall.phone);
    setSelectedLead(leadToCall);
    setCallError(null);
    setActiveCallSid(null);
    setCallState('IDLE');
    setIsInitiating(true);
    setTranscript([]);

    try {
      const res = await apiClient.post('/calls/initiate', {
        lead_id: leadToCall.id,
        phone_number: targetPhone,
        student_name: leadToCall.student_name
      });

      if (res && res.call_sid) {
        setActiveCallSid(res.call_sid);
        setCallState(res.status === 'ringing' || res.status === 'queued' ? 'RINGING' : 'CONNECTED');
        setAiTurnState('Speaking');

        setTranscript([
          { speaker: 'System', text: `Initiating outbound call to ${leadToCall.student_name} (${targetPhone})...`, timestamp: 'Just now' }
        ]);

        try {
          const openRes = await apiClient.get('/counselor/opening-message');
          setTranscript(prev => [
            ...prev,
            { speaker: 'Priya (AI Counselor)', text: openRes.message || `Hello ${leadToCall.student_name}! I'm Priya, your career counselor. How can I assist your tech journey today?`, timestamp: 'Just now' }
          ]);
        } catch (e) {
          console.warn('Failed fetching opening message:', e);
        }

        if (!res.twilio_configured) {
          setCallError("Twilio credentials not configured in backend environment. Running in active simulation mode.");
        }

        setTimeout(() => setAiTurnState('Listening'), 2000);
      } else {
        throw new Error(res?.message || "Backend did not return a valid Twilio Call SID.");
      }
    } catch (err) {
      setActiveCallSid(null);
      setCallState('IDLE');
      setAiTurnState('Idle');

      const rawError = err.response?.data?.detail || err.message || "Unable to start call. Please check backend connection and Twilio configuration.";
      let userFriendlyError = rawError;
      if (typeof rawError === 'string') {
        if (rawError.includes('21219') || rawError.toLowerCase().includes('unverified')) {
          userFriendlyError = `Twilio Error 21219: Destination number (${targetPhone}) is unverified. Twilio Trial accounts can only place outbound calls to verified phone numbers. Please verify this number in your Twilio Console or upgrade your Twilio account.`;
        }
      }
      setCallError(userFriendlyError);
    } finally {
      setIsInitiating(false);
    }
  };

  const handleEndCall = () => {
    setActiveCallSid(null);
    setCallState('COMPLETED');
    setAiTurnState('Idle');
    setTranscript(prev => [
      ...prev,
      { speaker: 'System', text: 'Call session completed. Conversation summary saved to database.', timestamp: 'Just now' }
    ]);
  };

  const handleSimulateTurn = async (e) => {
    e.preventDefault();
    if (!simText.trim()) return;

    const text = simText;
    setSimText('');

    setTranscript(prev => [
      ...prev,
      { speaker: selectedLead ? selectedLead.student_name : 'Student', text, timestamp: 'Just now' }
    ]);

    setAiTurnState('Thinking');

    try {
      const historyTurns = transcript.map(t => ({
        role: t.speaker.includes('Priya') ? 'model' : 'user',
        parts: [t.text]
      }));

      const reply = await apiClient.post('/counselor/chat', { message: text, history: historyTurns });
      setAiTurnState('Speaking');

      setTranscript(prev => [
        ...prev,
        { speaker: 'Priya (AI Counselor)', text: reply.response || reply.message, timestamp: 'Just now' }
      ]);

      setTimeout(() => setAiTurnState('Listening'), 2000);
    } catch (err) {
      setAiTurnState('Idle');
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 340px', gap: '20px', height: 'calc(100vh - 120px)' }}>
      {/* ------------------------------------------------------------------ */}
      {/* LEFT: CALL QUEUE */}
      {/* ------------------------------------------------------------------ */}
      <div className="counselor-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: 'var(--gold-primary)' }} />
            <span>Call Queue ({filteredLeads.length})</span>
          </h3>
        </div>

        {/* Search */}
        <div className="search-box" style={{ width: '100%', marginBottom: '14px' }}>
          <Search size={15} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search queue..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Queue List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredLeads.length > 0 ? (
            filteredLeads.map((lead) => {
              const isSelected = selectedLead?.id === lead.id;
              const isThisCalling = isInitiating && selectedLead?.id === lead.id;
              const formattedPhone = normalizePhoneNumber(lead.phone);
              return (
                <div
                  key={lead.id}
                  onClick={() => handleSelectLead(lead)}
                  style={{
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1px solid var(--gold-primary)' : '1px solid var(--border-light)',
                    background: isSelected ? 'var(--gold-soft)' : '#FFF',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>{lead.student_name}</h4>
                    <StatusBadge status={lead.lead_status || 'New'} />
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    {formattedPhone} • {lead.degree || 'B.Tech'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', color: 'var(--gold-dark)', fontWeight: '600' }}>
                      {lead.interest || 'Data Science'}
                    </span>
                    <button
                      className="btn btn-gold"
                      style={{ padding: '4px 10px', fontSize: '11.5px', opacity: isInitiating ? 0.7 : 1 }}
                      disabled={isInitiating || (callState !== 'IDLE' && callState !== 'COMPLETED')}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartCall(lead);
                      }}
                    >
                      <PhoneCall size={12} />
                      <span>{isThisCalling ? 'CALLING...' : 'CALL'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState title="No leads in queue" message="Upload leads or create a new contact." />
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* CENTER: ACTIVE AI CALL CONTROL ROOM */}
      {/* ------------------------------------------------------------------ */}
      <div className="counselor-card" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Error / Warning Notice */}
        {callError && (
          <div style={{ background: '#FFF8E6', color: '#B7791F', padding: '10px 16px', fontSize: '12px', borderBottom: '1px solid #FEEBC8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={15} style={{ shrink: 0 }} />
            <span>{callError}</span>
          </div>
        )}

        {/* Top Control Bar */}
        <div className="call-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isInitiating && (
              <span className="status-badge" style={{ background: '#FFF8E6', color: '#B7791F' }}>
                <div className="pulse-dot"></div>
                INITIATING OUTBOUND CALL...
              </span>
            )}
            {!isInitiating && callState === 'RINGING' && (
              <span className="status-badge" style={{ background: '#FFF8E6', color: '#B7791F' }}>
                <div className="pulse-dot"></div>
                RINGING STUDENT PHONE...
              </span>
            )}
            {!isInitiating && callState === 'CONNECTED' && (
              <span className="status-badge" style={{ background: '#EAF7EE', color: '#1E7E34' }}>
                <div className="pulse-dot"></div>
                AI CALL CONNECTED ({formatTimer(callDuration)})
              </span>
            )}
            {!isInitiating && callState === 'COMPLETED' && (
              <span className="status-badge completed">CALL COMPLETED</span>
            )}
            {!isInitiating && (callState === 'IDLE' || callState === 'FAILED') && (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>AI Agent Standby</span>
            )}
          </div>

          {/* Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              className={`control-btn ${isMuted ? 'end-call' : ''}`}
              style={{ background: isMuted ? '#FED7D7' : '#EDF2F7' }}
              onClick={() => setIsMuted(!isMuted)}
              disabled={isInitiating || callState === 'IDLE' || callState === 'COMPLETED' || callState === 'FAILED'}
            >
              {isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              className="control-btn"
              style={{ background: isOnHold ? '#FFF8E6' : '#EDF2F7' }}
              onClick={() => setIsOnHold(!isOnHold)}
              disabled={isInitiating || callState === 'IDLE' || callState === 'COMPLETED' || callState === 'FAILED'}
            >
              {isOnHold ? <Play size={16} /> : <Pause size={16} />}
            </button>

            {isInitiating ? (
              <button className="control-btn start-call" disabled style={{ opacity: 0.7 }}>
                <PhoneCall size={16} />
                <span>INITIATING CALL...</span>
              </button>
            ) : callState === 'RINGING' || callState === 'CONNECTED' ? (
              <button className="control-btn end-call" onClick={handleEndCall}>
                <PhoneOff size={16} />
                <span>END CALL</span>
              </button>
            ) : (
              <button
                className="control-btn start-call"
                onClick={() => handleStartCall(selectedLead)}
                disabled={!selectedLead}
              >
                <PhoneCall size={16} />
                <span>START AI CALL</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Call Header Indicator */}
        <div style={{ padding: '20px', background: 'linear-gradient(135deg, #111 0%, #1A1A1A 100%)', color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '50%',
              background: 'var(--gold-gradient)',
              color: '#111',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: aiTurnState === 'Speaking' ? '0 0 25px rgba(201,164,92,0.6)' : 'none'
            }}>
              <Bot size={28} />
            </div>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--gold-primary)', textTransform: 'uppercase', fontWeight: '700' }}>
                {isInitiating
                  ? `Initiating Call: ${selectedLead ? selectedLead.student_name : ''}`
                  : (callState === 'RINGING' || callState === 'CONNECTED')
                  ? `Calling: ${selectedLead ? selectedLead.student_name : ''}`
                  : selectedLead
                  ? `Target: ${selectedLead.student_name}`
                  : 'Select a Lead to Call'}
              </span>
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#FFFDF8' }}>
                {selectedLead ? normalizePhoneNumber(selectedLead.phone) : '+91 XXXXX XXXXX'}
              </h3>
            </div>
          </div>

          {/* Turn status indicator */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '12px', color: '#A0A0A0', marginBottom: '4px' }}>Turn State</div>
            {isInitiating ? (
              <span style={{ fontSize: '12px', color: 'var(--gold-primary)', fontWeight: '600' }}>● Initiating Call...</span>
            ) : callState === 'RINGING' ? (
              <span style={{ fontSize: '12px', color: '#B7791F', fontWeight: '600' }}>● Ringing...</span>
            ) : callState === 'CONNECTED' && aiTurnState === 'Speaking' ? (
              <div className="sound-wave">
                <span></span><span></span><span></span><span></span>
              </div>
            ) : callState === 'CONNECTED' && aiTurnState === 'Listening' ? (
              <span style={{ fontSize: '12px', color: '#28A745', fontWeight: '600' }}>● Listening to Student</span>
            ) : callState === 'CONNECTED' && aiTurnState === 'Thinking' ? (
              <span style={{ fontSize: '12px', color: 'var(--gold-primary)', fontWeight: '600' }}>● Gemini AI Thinking...</span>
            ) : (
              <span style={{ fontSize: '12px', color: '#777' }}>Ready</span>
            )}
          </div>
        </div>

        {/* Live Transcript Area */}
        <div className="chat-messages">
          {transcript.map((m, idx) => (
            <AIMessage key={idx} speaker={m.speaker} text={m.text} timestamp={m.timestamp} />
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Turn Simulator */}
        <form onSubmit={handleSimulateTurn} style={{ padding: '16px', background: '#FFF', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder={
              isInitiating
                ? "Initiating call..."
                : callState === 'CONNECTED' || callState === 'RINGING'
                ? "Type student turn response..."
                : "Select lead and click START AI CALL above..."
            }
            value={simText}
            onChange={(e) => setSimText(e.target.value)}
            disabled={isInitiating || callState === 'IDLE' || callState === 'COMPLETED' || callState === 'FAILED'}
            style={{ flex: 1, padding: '10px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', outline: 'none' }}
          />
          <button
            type="submit"
            className="btn btn-gold"
            disabled={isInitiating || callState === 'IDLE' || callState === 'COMPLETED' || callState === 'FAILED'}
            style={{ borderRadius: 'var(--radius-full)', padding: '0 20px' }}
          >
            <Send size={15} />
          </button>
        </form>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT: AI INSIGHTS PANEL */}
      {/* ------------------------------------------------------------------ */}
      <div className="counselor-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>Real-time AI Insights</span>
        </h3>

        {selectedLead ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1, overflowY: 'auto' }}>
            <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Student Candidate</span>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{selectedLead.student_name}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{selectedLead.degree || 'B.Tech'} ({selectedLead.branch || 'CSE'})</p>
            </div>

            <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Course Interest</span>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px', color: 'var(--gold-dark)' }}>{selectedLead.interest || 'Data Science & AI'}</h4>
            </div>

            <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Lead Score</span>
                <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{selectedLead.lead_score || 85} / 100</h4>
              </div>
              <StatusBadge status={selectedLead.score_label || 'High'} type="score" />
            </div>

            <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
              <span style={{ fontSize: '11px', color: 'var(--gold-dark)', textTransform: 'uppercase', fontWeight: '700' }}>AI Recommended Program</span>
              <h4 style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px' }}>{selectedLead.interest || 'Data Science & AI'}</h4>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                Priya AI recommends recommending the 6-Month Masterclass with placement guarantee.
              </p>
            </div>

            <div style={{ background: '#EAF7EE', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #C3E6CB' }}>
              <span style={{ fontSize: '11px', color: '#1E7E34', textTransform: 'uppercase', fontWeight: '700' }}>Suggested Next Action</span>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: '#1E7E34', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Send Workshop Pass</span>
                <ArrowRight size={14} />
              </h4>
            </div>
          </div>
        ) : (
          <EmptyState title="No Lead Selected" message="Select a student from the call queue on the left." />
        )}
      </div>
    </div>
  );
}
