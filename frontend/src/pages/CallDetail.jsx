import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { callsService } from '../services/callsService';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { ArrowLeft, Clock, Phone, Brain, Sparkles, FileText, CheckCircle } from 'lucide-react';

export default function CallDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [call, setCall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadCall = async () => {
    try {
      setLoading(true);
      const data = await callsService.getCallById(id);
      setCall(data);
    } catch (err) {
      console.error(err);
      setCall(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCall();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleProcessIntelligence = async () => {
    if (!call) return;
    try {
      setIsProcessing(true);
      await callsService.processIntelligence(call.id);
      showToast('Conversation Intelligence re-analyzed with Gemini!');
      loadCall();
    } catch (err) {
      alert('Failed processing intelligence: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <LoadingSkeleton rows={4} />;
  if (!call) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Call Record Not Found</h2>
      <button className="btn btn-gold" style={{ marginTop: '16px' }} onClick={() => navigate('/calls')}>Back to Call History</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toastMessage && (
        <div style={{ background: 'var(--bg-dark)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <button className="btn btn-outline" style={{ width: 'fit-content' }} onClick={() => navigate('/calls')}>
        <ArrowLeft size={16} />
        <span>Back to Calls</span>
      </button>

      {/* Main Header */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '4px' }}>Outbound Call: {call.student_name}</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Phone: {call.phone} • SID: {call.session_id} • Started: {call.created_at || call.start_time}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <StatusBadge status={call.status} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gold-dark)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={15} />
            {call.duration ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '0s'}
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: Full Transcript */}
        <div className="table-container" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--gold-dark)' }} />
            Full Speech Transcript
          </h3>
          <div style={{ background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            {call.transcript ? (
              <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '13.5px', color: 'var(--text-primary)', margin: 0, lineHeight: '1.6' }}>
                {call.transcript}
              </pre>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '13.5px', fontStyle: 'italic', margin: 0 }}>
                No transcript captured for this call attempt.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: AI Conversation Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div className="glass-card" style={{ padding: '24px', background: 'var(--gold-soft)', borderColor: 'var(--gold-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ color: 'var(--gold-dark)', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Brain size={18} /> Conversation Intelligence
              </h3>
              <button
                className="btn btn-outline"
                style={{ padding: '2px 8px', fontSize: '11px', background: '#FFF' }}
                disabled={isProcessing}
                onClick={handleProcessIntelligence}
              >
                <Sparkles size={12} />
                <span>{isProcessing ? 'Analyzing...' : 'Re-Analyze'}</span>
              </button>
            </div>

            <p style={{ fontSize: '13.5px', color: 'var(--text-primary)', marginBottom: '16px', lineHeight: '1.5' }}>
              <strong>Summary:</strong> {call.summary || 'Outbound call executed.'}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div><strong>Student Intent:</strong> {call.intent || 'Medium'}</div>
              <div><strong>Sentiment:</strong> {call.sentiment || 'Neutral'}</div>
              <div><strong>Key Topics:</strong> {call.key_topics || 'General inquiry'}</div>
              <div><strong>Objections:</strong> {call.objections || 'None'}</div>
              <div><strong>Recommended Next Action:</strong> {call.next_action || 'Schedule Follow-up'}</div>
            </div>
          </div>

          <div className="table-container" style={{ padding: '20px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '8px' }}>Call Metadata</h4>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}><strong>Worker / Agent:</strong> {call.worker || 'Priya AI Counselor'}</p>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}><strong>Course Interest:</strong> {call.course_recommended || 'Data Science & AI'}</p>
            {call.lead_id && (
              <button
                className="btn btn-gold"
                style={{ width: '100%', marginTop: '12px', fontSize: '12px' }}
                onClick={() => navigate(`/leads/${call.lead_id}`)}
              >
                View Student Lead Profile
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
