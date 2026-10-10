import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import {
  ListOrdered, PhoneCall, RefreshCw, Trash2, ArrowRight,
  Sparkles, ShieldAlert, Play, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CallQueue() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCall, setActiveCall] = useState(null);
  const [isCallingNext, setIsCallingNext] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const loadQueue = async () => {
    try {
      setLoading(true);
      const data = await apiClient.get('/queue');
      const list = Array.isArray(data) ? data : [];
      setQueue(list);

      // Check active in-progress item
      const active = list.find(i => i.status === 'in-progress' || i.status === 'calling');
      setActiveCall(active || null);
    } catch (err) {
      console.error(err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCallNext = async () => {
    try {
      setIsCallingNext(true);
      const res = await apiClient.post('/queue/next');
      if (res.queue_id) {
        showToast(res.message || 'Calling next queued lead...');
      } else {
        showToast('No pending calls in queue.');
      }
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed initiating next call');
    } finally {
      setIsCallingNext(false);
    }
  };

  const handleRemove = async (queueId) => {
    try {
      await apiClient.delete(`/queue/${queueId}`);
      showToast('Removed lead from queue.');
      loadQueue();
    } catch (err) {
      alert('Failed removing from queue');
    }
  };

  const handleRetry = async (queueId) => {
    try {
      await apiClient.post(`/queue/${queueId}/retry`);
      showToast('Reset queue item to pending retry.');
      loadQueue();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed retrying queue item');
    }
  };

  if (loading && queue.length === 0) return <LoadingSkeleton rows={5} type="table" />;

  const columns = [
    {
      header: 'Pos',
      accessor: 'position',
      render: (r) => <strong style={{ color: 'var(--gold-dark)', fontSize: '13px' }}>#{r.position}</strong>
    },
    {
      header: 'Student Candidate',
      accessor: 'student_name',
      render: (r) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{r.student_name}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.phone}</div>
        </div>
      )
    },
    { header: 'Target Course', accessor: 'course' },
    {
      header: 'Status / Protection',
      accessor: 'status',
      render: (r) => r.is_dnc ? (
        <span style={{ background: '#FDE8E8', color: '#9B2C2C', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: '700', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <ShieldAlert size={12} /> SKIPPED (DNC)
        </span>
      ) : (
        <StatusBadge status={r.status || 'pending'} />
      )
    },
    {
      header: 'Queue Actions',
      accessor: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn btn-gold"
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
            disabled={r.is_dnc}
            onClick={() => navigate(`/dialer?lead=${r.lead_id}`)}
          >
            <PhoneCall size={12} />
            <span>Call Lead</span>
          </button>

          {r.status === 'failed' && !r.is_dnc && (
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => handleRetry(r.id)}
              title="Retry Failed Call"
            >
              <RefreshCw size={12} />
            </button>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '11px', color: '#C53030' }}
            onClick={() => handleRemove(r.id)}
            title="Remove from Queue"
          >
            <Trash2 size={12} />
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

      {/* Active Call Banner */}
      {activeCall && (
        <div className="glass-card" style={{ padding: '20px 24px', background: 'var(--gold-soft)', borderColor: 'var(--gold-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--gold-dark)', textTransform: 'uppercase' }}>Active Outbound Call Session</span>
            <h3 style={{ fontSize: '18px', fontWeight: '700', marginTop: '2px' }}>{activeCall.student_name} ({activeCall.phone})</h3>
          </div>
          <button className="btn btn-gold" onClick={() => navigate('/dialer')}>
            <Play size={14} />
            <span>Open Live Dialer</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Outbound Call Queue Manager</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Queue ordering, call retry logic, and strict DNC protection rules for candidates.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-dark" disabled={isCallingNext} onClick={handleCallNext}>
            <PhoneCall size={15} />
            <span>{isCallingNext ? 'Initiating Call...' : 'CALL NEXT IN QUEUE'}</span>
          </button>

          <button className="btn btn-gold" onClick={() => navigate('/dialer')}>
            <Play size={15} />
            <span>Launch AI Dialer</span>
          </button>
        </div>
      </div>

      {/* Table */}
      {queue.length > 0 ? (
        <DataTable
          title={`Call Queue (${queue.length} Queue Items)`}
          columns={columns}
          data={queue}
        />
      ) : (
        <EmptyState
          title="No Candidates in Call Queue"
          message="Launch a campaign or add leads to queue to start outbound AI dialer execution."
          action={
            <button className="btn btn-gold" onClick={() => navigate('/campaigns')}>
              Go to Campaigns
            </button>
          }
        />
      )}
    </div>
  );
}
