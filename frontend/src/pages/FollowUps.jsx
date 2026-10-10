import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import {
  CalendarCheck, PhoneCall, Clock, CheckCircle,
  AlertCircle, XCircle, Sparkles, Trash2, Calendar
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function FollowUps() {
  const navigate = useNavigate();
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Reschedule Modal state
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [selectedFollowUp, setSelectedFollowUp] = useState(null);
  const [rescheduleData, setRescheduleData] = useState({
    due_date: new Date().toISOString().split('T')[0],
    due_time: '10:00 AM',
    reason: '',
    notes: ''
  });

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/follow-ups');
      setFollowups(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setFollowups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowups();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleComplete = async (id, name) => {
    try {
      await apiClient.post(`/follow-ups/${id}/complete`);
      showToast(`Follow-up with ${name} marked as Completed.`);
      loadFollowups();
    } catch (err) {
      alert('Failed completing follow-up');
    }
  };

  const handleCancel = async (id, name) => {
    try {
      await apiClient.post(`/follow-ups/${id}/cancel`);
      showToast(`Follow-up with ${name} canceled.`);
      loadFollowups();
    } catch (err) {
      alert('Failed canceling follow-up');
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiClient.delete(`/follow-ups/${id}`);
      showToast('Follow-up deleted.');
      loadFollowups();
    } catch (err) {
      alert('Failed deleting follow-up');
    }
  };

  const openRescheduleModal = (fu) => {
    setSelectedFollowUp(fu);
    setRescheduleData({
      due_date: fu.due_date || new Date().toISOString().split('T')[0],
      due_time: fu.due_time || '10:00 AM',
      reason: fu.reason || '',
      notes: fu.notes || ''
    });
    setIsRescheduleOpen(true);
  };

  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFollowUp) return;
    try {
      await apiClient.put(`/follow-ups/${selectedFollowUp.id}`, {
        due_date: rescheduleData.due_date,
        due_time: rescheduleData.due_time,
        reason: rescheduleData.reason,
        notes: rescheduleData.notes,
        status: 'Upcoming'
      });
      setIsRescheduleOpen(false);
      showToast(`Rescheduled follow-up to ${rescheduleData.due_date}!`);
      loadFollowups();
    } catch (err) {
      alert('Failed rescheduling follow-up');
    }
  };

  // Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  const upcomingCount = followups.filter(f => f.status === 'Upcoming').length;
  const todayCount = followups.filter(f => f.due_date === todayStr && f.status !== 'Completed').length;
  const overdueCount = followups.filter(f => f.status === 'Overdue').length;
  const completedCount = followups.filter(f => f.status === 'Completed').length;

  if (loading && followups.length === 0) return <LoadingSkeleton rows={5} type="table" />;

  const columns = [
    {
      header: 'Student Candidate',
      accessor: 'student_name',
      render: (r) => (
        <div>
          <strong style={{ fontSize: '14px' }}>{r.student_name}</strong>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{r.phone || 'No Phone'}</div>
        </div>
      )
    },
    { header: 'Callback Reason', accessor: 'reason' },
    {
      header: 'Scheduled Date & Time',
      accessor: 'due_date',
      render: (r) => `${r.due_date} at ${r.due_time || '10:00 AM'}`
    },
    { header: 'Assigned Agent', accessor: 'assigned_agent', render: (r) => r.assigned_agent || 'Priya AI' },
    { header: 'Status', accessor: 'status', render: (r) => <StatusBadge status={r.status || 'Upcoming'} /> },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            className="btn btn-gold"
            style={{ padding: '4px 10px', fontSize: '11.5px' }}
            onClick={() => navigate(`/dialer?lead=${r.lead_id}`)}
          >
            <PhoneCall size={12} />
            <span>Call</span>
          </button>

          {r.status !== 'Completed' && (
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#1E7E34', borderColor: '#A7F3D0' }}
              onClick={() => handleComplete(r.id, r.student_name)}
              title="Mark Complete"
            >
              <CheckCircle size={13} />
            </button>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '11px' }}
            onClick={() => openRescheduleModal(r)}
            title="Reschedule"
          >
            <Calendar size={13} />
          </button>

          {r.status !== 'Canceled' && (
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#9B2C2C' }}
              onClick={() => handleCancel(r.id, r.student_name)}
              title="Cancel Follow-up"
            >
              <XCircle size={13} />
            </button>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '11px', color: '#C53030' }}
            onClick={() => handleDelete(r.id)}
            title="Delete"
          >
            <Trash2 size={13} />
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

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <StatCard label="Today's Follow-ups" value={todayCount} change="Due Today" icon={CalendarCheck} />
        <StatCard label="Overdue Follow-ups" value={overdueCount} isPositive={false} change="Requires Action" icon={AlertCircle} />
        <StatCard label="Total Upcoming" value={upcomingCount} change="Scheduled" icon={Clock} />
        <StatCard label="Completed Follow-ups" value={completedCount} change="Finished" icon={CheckCircle} />
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Student Follow-ups & Scheduled Callbacks</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Callbacks and follow-up turns requested by students during AI counseling conversations.
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => navigate('/dialer')}>
          <PhoneCall size={16} />
          <span>Launch AI Dialer</span>
        </button>
      </div>

      {/* Main Table */}
      {followups.length > 0 ? (
        <DataTable
          title={`Scheduled Follow-ups (${followups.length})`}
          columns={columns}
          data={followups}
        />
      ) : (
        <EmptyState
          title="No Scheduled Follow-ups"
          message="No pending callback requests found in database. Schedule follow-ups directly from Lead profile or AI calls."
          action={<button className="btn btn-gold" onClick={() => navigate('/leads')}>Go to Leads</button>}
        />
      )}

      {/* Reschedule Modal */}
      <Modal isOpen={isRescheduleOpen} onClose={() => setIsRescheduleOpen(false)} title={`Reschedule Follow-Up: ${selectedFollowUp?.student_name}`}>
        <form onSubmit={handleRescheduleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Reason *</label>
            <input type="text" required value={rescheduleData.reason} onChange={e => setRescheduleData({ ...rescheduleData, reason: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>New Date *</label>
              <input type="date" required value={rescheduleData.due_date} onChange={e => setRescheduleData({ ...rescheduleData, due_date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Time</label>
              <input type="text" value={rescheduleData.due_time} onChange={e => setRescheduleData({ ...rescheduleData, due_time: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Notes</label>
            <textarea value={rescheduleData.notes} onChange={e => setRescheduleData({ ...rescheduleData, notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', height: '60px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsRescheduleOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Reschedule</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
