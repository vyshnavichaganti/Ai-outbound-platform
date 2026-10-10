import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { leadsService } from '../services/leadsService';
import apiClient from '../services/api';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import {
  ArrowLeft, Phone, GraduationCap, BookOpen, Calendar, Award,
  MessageSquare, Edit3, Trash2, ShieldAlert, ShieldCheck, Clock, Sparkles, UserCheck
} from 'lucide-react';

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  const [leadForm, setLeadForm] = useState({
    student_name: '',
    phone: '',
    email: '',
    degree: 'B.Tech',
    year: '3rd Year',
    branch: 'CSE',
    career_goal: 'Software Engineer',
    interest: 'Data Science & AI',
    budget: '₹30,000',
    mode: 'Online Live',
    lead_status: 'New'
  });

  const [followUpForm, setFollowUpForm] = useState({
    reason: 'Follow-up career counseling',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '10:00 AM',
    notes: ''
  });

  const loadLead = async () => {
    try {
      setLoading(true);
      const data = await leadsService.getLeadById(id);
      setLead(data);
      setLeadForm({
        student_name: data.student_name || '',
        phone: data.phone || '',
        email: data.email || '',
        degree: data.degree || 'B.Tech',
        year: data.year || '3rd Year',
        branch: data.branch || 'CSE',
        career_goal: data.career_goal || 'Software Engineer',
        interest: data.interest || 'Data Science & AI',
        budget: data.budget || '₹30,000',
        mode: data.mode || 'Online Live',
        lead_status: data.lead_status || 'New'
      });
    } catch (err) {
      console.error(err);
      setLead(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLead();
  }, [id]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    try {
      await leadsService.updateLead(id, leadForm);
      setIsEditModalOpen(false);
      showToast('Lead updated successfully in database!');
      loadLead();
    } catch (err) {
      alert('Failed to update lead');
    }
  };

  const handleDeleteLead = async () => {
    try {
      await leadsService.deleteLead(id);
      navigate('/leads');
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  const handleMarkDNC = async () => {
    try {
      await leadsService.markDNC(id);
      showToast(`Marked ${lead.student_name} as Do Not Call (DNC).`);
      loadLead();
    } catch (err) {
      alert('Failed updating DNC status');
    }
  };

  const handleUnmarkDNC = async () => {
    try {
      await leadsService.unmarkDNC(id);
      showToast(`Removed DNC status for ${lead.student_name}.`);
      loadLead();
    } catch (err) {
      alert('Failed unmarking DNC status');
    }
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/follow-ups', {
        lead_id: Number(id),
        student_name: lead.student_name,
        reason: followUpForm.reason,
        due_date: followUpForm.due_date,
        due_time: followUpForm.due_time,
        notes: followUpForm.notes
      });
      setIsFollowUpModalOpen(false);
      showToast('Follow-up scheduled successfully!');
      loadLead();
    } catch (err) {
      alert('Failed to schedule follow-up');
    }
  };

  if (loading) return <LoadingSkeleton rows={5} />;
  if (!lead) return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Lead Record Not Found</h2>
      <button className="btn btn-gold" style={{ marginTop: '16px' }} onClick={() => navigate('/leads')}>Back to Leads</button>
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

      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-outline" onClick={() => navigate('/leads')}>
          <ArrowLeft size={16} />
          <span>Back to Leads</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => setIsEditModalOpen(true)}>
            <Edit3 size={15} />
            <span>Edit Profile</span>
          </button>

          <button className="btn btn-outline" onClick={() => setIsFollowUpModalOpen(true)}>
            <Calendar size={15} />
            <span>Schedule Follow-Up</span>
          </button>

          {!lead.is_dnc ? (
            <button className="btn btn-outline" style={{ color: '#9B2C2C', borderColor: '#FCA5A5' }} onClick={handleMarkDNC}>
              <ShieldAlert size={15} />
              <span>Mark DNC</span>
            </button>
          ) : (
            <button className="btn btn-outline" style={{ color: '#047857', borderColor: '#6EE7B7' }} onClick={handleUnmarkDNC}>
              <ShieldCheck size={15} />
              <span>Unmark DNC</span>
            </button>
          )}

          <button className="btn btn-outline" style={{ color: '#C53030', borderColor: '#FEB2B2' }} onClick={() => setIsDeleteModalOpen(true)}>
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </div>

      {/* Student Banner */}
      <div className="glass-card" style={{ padding: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '700' }}>{lead.student_name}</h2>
            {lead.is_dnc && (
              <span style={{ background: '#FDE8E8', color: '#9B2C2C', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: '700', fontSize: '11px' }}>
                DNC (OPTED OUT)
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            {lead.phone || 'No Phone'} • {lead.email || 'No Email'} • Added on {lead.created_at || 'Recently'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <StatusBadge status={lead.lead_status || 'New'} />
          <StatusBadge status={lead.lead_score || 75} type="score" />
          <button
            className="btn btn-gold"
            disabled={lead.is_dnc}
            onClick={() => navigate(`/dialer?lead=${lead.id}`)}
          >
            <Phone size={16} />
            <span>Call Lead</span>
          </button>
        </div>
      </div>

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Profile Card */}
          <div className="table-container" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={18} style={{ color: 'var(--gold-dark)' }} />
              Academic & Career Profile
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '14px' }}>
              <div><strong>Degree:</strong> {lead.degree}</div>
              <div><strong>Year of Study:</strong> {lead.year}</div>
              <div><strong>Branch / Field:</strong> {lead.branch}</div>
              <div><strong>Career Goal:</strong> {lead.career_goal}</div>
              <div><strong>Target Course:</strong> {lead.interest}</div>
              <div><strong>Preferred Mode:</strong> {lead.mode}</div>
              <div><strong>Budget:</strong> {lead.budget}</div>
              <div><strong>Language:</strong> {lead.language}</div>
            </div>
          </div>

          {/* Call History */}
          <div className="table-container" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Phone size={18} style={{ color: 'var(--gold-dark)' }} />
              Call History ({lead.call_logs ? lead.call_logs.length : 0})
            </h3>
            {lead.call_logs && lead.call_logs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {lead.call_logs.map(log => (
                  <div key={log.id} style={{ background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontWeight: '700', fontSize: '13px' }}>Worker: {log.worker}</span>
                      <StatusBadge status={log.status} />
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                      <strong>Summary:</strong> {log.summary || 'Outbound call executed.'}
                    </p>
                    {log.transcript && (
                      <div style={{ background: '#FFF', padding: '10px', borderRadius: '6px', fontSize: '12px', color: '#555', fontStyle: 'italic' }}>
                        "{log.transcript.slice(0, 180)}{log.transcript.length > 180 ? '...' : ''}"
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '11px', color: 'var(--text-muted)' }}>
                      <span>{log.created_at}</span>
                      <button className="btn btn-outline" style={{ padding: '2px 8px', fontSize: '11px' }} onClick={() => navigate(`/calls/${log.id}`)}>
                        View Call Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No call turns recorded yet for this lead candidate.
              </p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Target Course Info */}
          <div className="glass-card" style={{ padding: '24px', background: 'var(--gold-soft)', borderColor: 'var(--gold-border)' }}>
            <h3 style={{ color: 'var(--gold-dark)', fontSize: '15px', fontWeight: '700', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} /> Recommended Course
            </h3>
            <h4 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px' }}>{lead.interest || 'Data Science & AI'}</h4>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Budget: {lead.budget} • Mode: {lead.mode}</p>
          </div>

          {/* Follow-ups */}
          <div className="table-container" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} style={{ color: 'var(--gold-dark)' }} />
              Scheduled Follow-Ups ({lead.follow_ups ? lead.follow_ups.length : 0})
            </h3>
            {lead.follow_ups && lead.follow_ups.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {lead.follow_ups.map(fu => (
                  <div key={fu.id} style={{ background: '#FFF', padding: '12px', borderRadius: '6px', border: '1px solid var(--border-light)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '13px' }}>{fu.reason}</strong>
                      <StatusBadge status={fu.status} />
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Due: {fu.due_date} at {fu.due_time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active follow-ups scheduled.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Lead: ${lead.student_name}`}>
        <form onSubmit={handleUpdateLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Student Name *</label>
              <input type="text" required value={leadForm.student_name} onChange={e => setLeadForm({ ...leadForm, student_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number *</label>
              <input type="text" required value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email</label>
              <input type="email" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
              <select value={leadForm.lead_status} onChange={e => setLeadForm({ ...leadForm, lead_status: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Qualified">Qualified</option>
                <option value="Workshop Registered">Workshop Registered</option>
                <option value="Converted">Converted</option>
                <option value="DNC">DNC (Opted Out)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Course Interest</label>
              <select value={leadForm.interest} onChange={e => setLeadForm({ ...leadForm, interest: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Full Stack Web Development">Full Stack Web Dev</option>
                <option value="Cloud Computing & DevOps">Cloud & DevOps</option>
                <option value="Cybersecurity Engineering">Cybersecurity</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Career Goal</label>
              <input type="text" value={leadForm.career_goal} onChange={e => setLeadForm({ ...leadForm, career_goal: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Lead">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p>Are you sure you want to delete lead <strong>{lead.student_name}</strong>? This action will remove the lead record from the database.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-dark" style={{ background: '#C53030' }} onClick={handleDeleteLead}>Delete Lead</button>
          </div>
        </div>
      </Modal>

      {/* Follow Up Modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title={`Schedule Follow-up for ${lead.student_name}`}>
        <form onSubmit={handleScheduleFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Reason *</label>
            <input type="text" required value={followUpForm.reason} onChange={e => setFollowUpForm({ ...followUpForm, reason: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Due Date *</label>
              <input type="date" required value={followUpForm.due_date} onChange={e => setFollowUpForm({ ...followUpForm, due_date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Time</label>
              <input type="text" value={followUpForm.due_time} onChange={e => setFollowUpForm({ ...followUpForm, due_time: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Notes</label>
            <textarea value={followUpForm.notes} onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', height: '70px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Schedule Follow-up</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
