import React, { useState, useEffect } from 'react';
import { callsService } from '../services/callsService';
import StatCard from '../components/StatCard';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Drawer from '../components/Drawer';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  PhoneCall, PhoneIncoming, PhoneOff, Clock, Play, FileText,
  Search, Sparkles, Brain, CheckCircle, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Calls() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState([]);
  const [filteredCalls, setFilteredCalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedCall, setSelectedCall] = useState(null);
  const [isProcessingIntel, setIsProcessingIntel] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const fetchCalls = async () => {
    try {
      setLoading(true);
      const data = await callsService.getCallLogs();
      const list = Array.isArray(data) ? data : [];
      setCalls(list);
      setFilteredCalls(list);
    } catch (err) {
      console.error(err);
      setCalls([]);
      setFilteredCalls([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
  }, []);

  useEffect(() => {
    let result = [...calls];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c =>
        (c.student_name && c.student_name.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.session_id && c.session_id.toLowerCase().includes(q)) ||
        (c.course_recommended && c.course_recommended.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'All') {
      result = result.filter(c => String(c.status).toLowerCase() === statusFilter.toLowerCase());
    }
    setFilteredCalls(result);
  }, [searchQuery, statusFilter, calls]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleProcessIntelligence = async (callId) => {
    try {
      setIsProcessingIntel(true);
      const res = await callsService.processIntelligence(callId);
      showToast('Conversation Intelligence generated with Gemini AI!');
      fetchCalls();
      if (res.log) {
        setSelectedCall(res.log);
      }
    } catch (err) {
      alert('Failed processing intelligence: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsProcessingIntel(false);
    }
  };

  // Compute real statistics from calls
  const totalCallsCount = calls.length;
  const connectedCount = calls.filter(c => ['completed', 'in-progress', 'in_progress'].includes(String(c.status).toLowerCase())).length;
  const completedCount = calls.filter(c => String(c.status).toLowerCase() === 'completed').length;
  const missedCount = calls.filter(c => ['failed', 'no-answer', 'busy', 'canceled'].includes(String(c.status).toLowerCase())).length;

  const totalDurationSeconds = calls.reduce((acc, c) => acc + (Number(c.duration) || 0), 0);
  const avgDurationSeconds = totalCallsCount > 0 ? Math.round(totalDurationSeconds / totalCallsCount) : 0;
  const avgDurationMinutes = `${Math.floor(avgDurationSeconds / 60)}m ${avgDurationSeconds % 60}s`;

  if (loading && calls.length === 0) return <LoadingSkeleton rows={5} type="table" />;

  const columns = [
    {
      header: 'Student Candidate',
      accessor: 'student_name',
      render: (row) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{row.student_name}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{row.phone || 'N/A'} • Call SID: {row.session_id || 'SIM'}</div>
        </div>
      )
    },
    {
      header: 'Date & Time',
      accessor: 'created_at',
      render: (r) => r.created_at || 'Recently'
    },
    {
      header: 'Duration',
      accessor: 'duration',
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
          <Clock size={13} style={{ color: 'var(--text-muted)' }} />
          <span>{row.duration ? `${Math.floor(row.duration / 60)}m ${row.duration % 60}s` : '0s'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status || 'completed'} />
    },
    { header: 'Course Interest', accessor: 'course_recommended' },
    {
      header: 'Intent / Sentiment',
      accessor: 'intent',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
          <span style={{ background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
            Intent: {r.intent || 'Medium'}
          </span>
          <span style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
            {r.sentiment || 'Neutral'}
          </span>
        </div>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-gold"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => setSelectedCall(row)}
          >
            View Drawer
          </button>
          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => navigate(`/calls/${row.id}`)}
          >
            <ExternalLink size={13} />
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {toastMessage && (
        <div style={{ background: 'var(--bg-dark)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Real Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <StatCard label="Total Calls" value={totalCallsCount} change="Database Real" icon={PhoneCall} />
        <StatCard label="Connected Calls" value={connectedCount} change="Twilio Live" icon={PhoneIncoming} />
        <StatCard label="Completed Calls" value={completedCount} change="Finished" icon={CheckCircle} />
        <StatCard label="Missed / Unanswered" value={missedCount} isPositive={false} change="No Answer" icon={PhoneOff} />
        <StatCard label="Avg Call Duration" value={avgDurationMinutes} change="Real Time" icon={Clock} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '260px' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search candidate, phone, Call SID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
          >
            <option value="All">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="ringing">Ringing</option>
            <option value="busy">Busy</option>
            <option value="no-answer">No Answer</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table or Empty State */}
      {filteredCalls.length > 0 ? (
        <DataTable
          title={`AI Outbound Call Logs (${filteredCalls.length})`}
          columns={columns}
          data={filteredCalls}
          onRowClick={(row) => setSelectedCall(row)}
        />
      ) : (
        <EmptyState
          title="NO CALL RECORDS FOUND"
          message="Initiate outbound calls from the Dialer or Leads CRM to generate call history."
          action={
            <button className="btn btn-gold" onClick={() => navigate('/dialer')}>
              <PhoneCall size={16} />
              <span>Open AI Dialer</span>
            </button>
          }
        />
      )}

      {/* Call Details Drawer */}
      <Drawer
        isOpen={!!selectedCall}
        onClose={() => setSelectedCall(null)}
        title={`Call Details — ${selectedCall?.student_name || 'Call'}`}
      >
        {selectedCall && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header info */}
            <div style={{ background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                <StatusBadge status={selectedCall.status} />
                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--gold-dark)' }}>
                  Duration: {selectedCall.duration ? `${selectedCall.duration}s` : '0s'}
                </span>
              </div>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Call SID:</strong> {selectedCall.session_id}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Phone:</strong> {selectedCall.phone}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Agent / Worker:</strong> {selectedCall.worker || 'Priya AI'}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Recommended Course:</strong> {selectedCall.course_recommended}</p>
            </div>

            {/* Conversation Intelligence Block */}
            <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h4 style={{ color: 'var(--gold-dark)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Brain size={16} /> Conversation Intelligence
                </h4>
                <button
                  className="btn btn-outline"
                  style={{ padding: '2px 8px', fontSize: '11px', background: '#FFF' }}
                  disabled={isProcessingIntel}
                  onClick={() => handleProcessIntelligence(selectedCall.id)}
                >
                  <Sparkles size={12} />
                  <span>{isProcessingIntel ? 'Analyzing...' : 'Re-Analyze'}</span>
                </button>
              </div>

              <p style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '10px' }}>
                {selectedCall.summary || 'Call session recorded.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px' }}>
                <div><strong>Intent Level:</strong> {selectedCall.intent || 'Medium'}</div>
                <div><strong>Sentiment:</strong> {selectedCall.sentiment || 'Neutral'}</div>
                <div><strong>Key Topics:</strong> {selectedCall.key_topics || 'General'}</div>
                <div><strong>Objections:</strong> {selectedCall.objections || 'None'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>Next Action:</strong> {selectedCall.next_action || 'Follow-up'}</div>
              </div>
            </div>

            {/* Full Transcript */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={16} /> Conversation Transcript
              </h4>
              <div style={{ background: '#FAF8F3', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', maxHeight: '300px', overflowY: 'auto' }}>
                {selectedCall.transcript ? (
                  <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '12.5px', color: 'var(--text-primary)', margin: 0 }}>
                    {selectedCall.transcript}
                  </pre>
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
                    No transcript recorded for this call.
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '12px', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-gold" onClick={() => navigate(`/calls/${selectedCall.id}`)}>
                <ExternalLink size={14} />
                <span>Open Full Details Page</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
