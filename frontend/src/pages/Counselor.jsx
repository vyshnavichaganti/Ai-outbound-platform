import React, { useState, useEffect, useRef } from 'react';
import AIMessage from '../components/AIMessage';
import StatusBadge from '../components/StatusBadge';
import { counselorService } from '../services/counselorService';
import { leadsService } from '../services/leadsService';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Send,
  Sparkles,
  Bot,
  User,
  GraduationCap,
  Target,
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export default function Counselor() {
  const [leads, setLeads] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [aiStatus, setAiStatus] = useState('Idle'); // Idle, Listening, Speaking, Thinking
  const [insights, setInsights] = useState({
    education: 'B.Tech CSE',
    interest: 'Data Science & AI',
    score: 84,
    intent: 'High',
    recommended: 'Data Science & AI',
    nextAction: 'Workshop Invitation'
  });

  const chatBottomRef = useRef(null);

  useEffect(() => {
    async function init() {
      try {
        const studentList = await leadsService.getLeads();
        setLeads(studentList);
        if (studentList.length > 0) {
          setSelectedStudent(studentList[0]);
        }
        const openMsg = await counselorService.getOpeningMessage();
        setMessages([
          { speaker: 'Priya (AI Counselor)', text: openMsg.message, timestamp: '10:00 AM' }
        ]);
      } catch (err) {
        console.error(err);
      }
    }
    init();
  }, []);

  // Timer for active call
  useEffect(() => {
    let timer;
    if (isCalling) {
      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(timer);
  }, [isCalling]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiStatus]);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setIsCalling(true);
    setAiStatus('Speaking');
    setMessages(prev => [
      ...prev,
      { speaker: 'Priya (AI Counselor)', text: `Hello ${selectedStudent ? selectedStudent.student_name : 'there'}! I'm Priya, your career counselor. How can I assist you with your tech career today?`, timestamp: 'Just now' }
    ]);
    setTimeout(() => setAiStatus('Listening'), 2000);
  };

  const handleEndCall = () => {
    setIsCalling(false);
    setAiStatus('Idle');
    setMessages(prev => [
      ...prev,
      { speaker: 'System', text: 'Call ended by operator. Summary generated.', timestamp: 'Just now' }
    ]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userText = inputText;
    setInputText('');

    // Add student message
    setMessages(prev => [
      ...prev,
      { speaker: selectedStudent ? selectedStudent.student_name : 'Student', text: userText, timestamp: 'Just now' }
    ]);

    setAiStatus('Thinking');

    // Call API
    try {
      const historyTurns = messages.map(m => ({
        role: m.speaker.includes('Priya') ? 'model' : 'user',
        parts: [m.text]
      }));

      const res = await counselorService.chat(userText, historyTurns);
      setAiStatus('Speaking');

      setMessages(prev => [
        ...prev,
        { speaker: 'Priya (AI Counselor)', text: res.response, timestamp: 'Just now' }
      ]);

      // Update AI Insights based on response
      if (userText.toLowerCase().includes('data science') || userText.toLowerCase().includes('ai')) {
        setInsights(prev => ({ ...prev, interest: 'Data Science & AI', recommended: 'Data Science & AI', score: 92, intent: 'High' }));
      } else if (userText.toLowerCase().includes('web') || userText.toLowerCase().includes('full stack')) {
        setInsights(prev => ({ ...prev, interest: 'Full Stack Web Dev', recommended: 'Full Stack Web Dev', score: 88, intent: 'High' }));
      }

      setTimeout(() => {
        if (isCalling) setAiStatus('Listening');
        else setAiStatus('Idle');
      }, 2500);

    } catch (err) {
      setAiStatus('Idle');
    }
  };

  return (
    <div className="counselor-grid">
      {/* LEFT PANEL: Student Selector & Info */}
      <div className="counselor-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <User size={18} style={{ color: 'var(--gold-dark)' }} />
          <span>Active Student Profile</span>
        </h3>

        {/* Student Selector */}
        <select
          value={selectedStudent?.id || ''}
          onChange={(e) => {
            const found = leads.find(l => String(l.id) === e.target.value);
            if (found) {
              setSelectedStudent(found);
              setInsights({
                education: `${found.degree || 'B.Tech'} ${found.branch || 'CSE'}`,
                interest: found.interest || 'Data Science & AI',
                score: found.lead_score || 85,
                intent: 'High',
                recommended: found.interest || 'Data Science & AI',
                nextAction: 'Workshop Invitation'
              });
            }
          }}
          style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', marginBottom: '16px', background: '#FFF' }}
        >
          {leads.map(s => (
            <option key={s.id} value={s.id}>{s.student_name} ({s.degree || 'B.Tech'})</option>
          ))}
        </select>

        {selectedStudent && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Name</span>
              <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{selectedStudent.student_name}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Phone</span>
              <p>{selectedStudent.phone}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Education</span>
              <p>{selectedStudent.degree} - {selectedStudent.year || '3rd Year'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Career Goal</span>
              <p>{selectedStudent.career_goal || 'Software Engineer'}</p>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)', fontSize: '11px', textTransform: 'uppercase', fontWeight: '600' }}>Status</span>
              <div style={{ marginTop: '4px' }}><StatusBadge status={selectedStudent.lead_status} /></div>
            </div>
          </div>
        )}
      </div>

      {/* CENTER PANEL: Live AI Conversation Simulator */}
      <div className="counselor-card">
        {/* Top Control Bar */}
        <div className="call-controls">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isCalling ? (
              <div className="status-indicator">
                <div className="pulse-dot"></div>
                <span>Call Connected ({formatTimer(callDuration)})</span>
              </div>
            ) : (
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Call Standby</span>
            )}

            {/* Sound Wave when speaking */}
            {aiStatus === 'Speaking' && (
              <div className="sound-wave">
                <span></span><span></span><span></span><span></span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', items: 'center', gap: '10px' }}>
            <button
              className={`control-btn ${isMuted ? 'end-call' : ''}`}
              style={{ background: isMuted ? '#FED7D7' : '#EDF2F7', color: isMuted ? '#9B2C2C' : '#4A5568' }}
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <button
              className="control-btn"
              style={{ background: isSpeakerOn ? '#EBF8FF' : '#EDF2F7', color: isSpeakerOn ? '#2B6CB0' : '#4A5568' }}
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              title="Speaker"
            >
              {isSpeakerOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            {!isCalling ? (
              <button className="control-btn start-call" onClick={handleStartCall}>
                <Phone size={16} />
                <span>Start Call</span>
              </button>
            ) : (
              <button className="control-btn end-call" onClick={handleEndCall}>
                <PhoneOff size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Message Stream */}
        <div className="chat-messages">
          {messages.map((m, idx) => (
            <AIMessage key={idx} speaker={m.speaker} text={m.text} timestamp={m.timestamp} />
          ))}
          {aiStatus === 'Thinking' && (
            <div style={{ alignSelf: 'flex-start', color: 'var(--text-muted)', fontSize: '12px', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bot size={16} className="pulse-dot" />
              <span>Priya AI is analyzing response...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSendMessage} style={{ padding: '16px', background: '#FFF', borderTop: '1px solid var(--border-light)', display: 'flex', gap: '12px' }}>
          <input
            type="text"
            placeholder={isCalling ? "Speak or type student response..." : "Simulate student message..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, padding: '12px 16px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', outline: 'none' }}
          />
          <button type="submit" className="btn btn-gold" style={{ borderRadius: 'var(--radius-full)', padding: '0 20px' }}>
            <Send size={16} />
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: Real-time AI Insights */}
      <div className="counselor-card" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>Real-time AI Insights</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Current Education</span>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{insights.education}</h4>
          </div>

          <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Expressed Interest</span>
            <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px', color: 'var(--gold-dark)' }}>{insights.interest}</h4>
          </div>

          <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Lead Score</span>
              <h4 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)' }}>{insights.score} / 100</h4>
            </div>
            <span className="badge-gold">{insights.intent} Intent</span>
          </div>

          <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
            <span style={{ fontSize: '11px', color: 'var(--gold-dark)', textTransform: 'uppercase', fontWeight: '700' }}>AI Recommended Course</span>
            <h4 style={{ fontSize: '16px', fontWeight: '700', marginTop: '4px', color: 'var(--text-primary)' }}>{insights.recommended}</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
              6-Month Master track with guaranteed placement support and 6+ capstones.
            </p>
          </div>

          <div style={{ background: '#EAF7EE', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid #C3E6CB' }}>
            <span style={{ fontSize: '11px', color: '#1E7E34', textTransform: 'uppercase', fontWeight: '700' }}>Suggested Next Action</span>
            <h4 style={{ fontSize: '14px', fontWeight: '700', marginTop: '4px', color: '#1E7E34', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{insights.nextAction}</span>
              <ArrowRight size={14} />
            </h4>
          </div>
        </div>
      </div>
    </div>
  );
}
