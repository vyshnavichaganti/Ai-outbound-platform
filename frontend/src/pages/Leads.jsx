import React, { useState, useEffect } from 'react';
import { leadsService } from '../services/leadsService';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Drawer from '../components/Drawer';
import Modal from '../components/Modal';
import ImportWizard from '../components/ImportWizard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  Search, Plus, Upload, Phone, Download, ShieldAlert, ShieldCheck,
  Sparkles, Edit3, Trash2, Calendar, Eye, ExternalLink, ArrowUpDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Leads() {
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedInterest, setSelectedInterest] = useState('All');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Modals & Drawers state
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [isImportWizardOpen, setIsImportWizardOpen] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);
  const [leadToDelete, setLeadToDelete] = useState(null);
  const [leadForFollowUp, setLeadForFollowUp] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Form states
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
    reason: 'Career guidance call',
    due_date: new Date().toISOString().split('T')[0],
    due_time: '10:00 AM',
    notes: ''
  });

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const list = await leadsService.getLeads({
        search: searchQuery,
        status: selectedStatus,
        interest: selectedInterest,
        sort_by: sortBy,
        order: sortOrder
      });
      setLeads(list);
      setFilteredLeads(list);
    } catch (err) {
      console.error("Failed loading leads:", err);
      setLeads([]);
      setFilteredLeads([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [selectedStatus, selectedInterest, sortBy, sortOrder]);

  useEffect(() => {
    let result = [...leads];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(l =>
        (l.student_name && l.student_name.toLowerCase().includes(q)) ||
        (l.phone && l.phone.includes(q)) ||
        (l.email && l.email.toLowerCase().includes(q)) ||
        (l.interest && l.interest.toLowerCase().includes(q)) ||
        (l.degree && l.degree.toLowerCase().includes(q))
      );
    }
    setFilteredLeads(result);
  }, [searchQuery, leads]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Create Lead
  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!leadForm.student_name) return;
    try {
      await leadsService.createLead(leadForm);
      setIsAddModalOpen(false);
      resetForm();
      showToast('Lead candidate created successfully in database!');
      fetchLeads();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to create lead');
    }
  };

  // Edit Lead
  const openEditModal = (lead) => {
    setLeadToEdit(lead);
    setLeadForm({
      student_name: lead.student_name || '',
      phone: lead.phone || '',
      email: lead.email || '',
      degree: lead.degree || 'B.Tech',
      year: lead.year || '3rd Year',
      branch: lead.branch || 'CSE',
      career_goal: lead.career_goal || 'Software Engineer',
      interest: lead.interest || 'Data Science & AI',
      budget: lead.budget || '₹30,000',
      mode: lead.mode || 'Online Live',
      lead_status: lead.lead_status || 'New'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e) => {
    e.preventDefault();
    if (!leadToEdit) return;
    try {
      await leadsService.updateLead(leadToEdit.id, leadForm);
      setIsEditModalOpen(false);
      setLeadToEdit(null);
      resetForm();
      showToast(`Updated profile for ${leadForm.student_name}!`);
      fetchLeads();
      if (selectedLead && selectedLead.id === leadToEdit.id) {
        const updated = await leadsService.getLeadById(leadToEdit.id);
        setSelectedLead(updated);
      }
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed to update lead in database');
    }
  };

  // Delete Lead
  const openDeleteModal = (lead) => {
    setLeadToDelete(lead);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteLead = async () => {
    if (!leadToDelete) return;
    try {
      await leadsService.deleteLead(leadToDelete.id);
      setIsDeleteModalOpen(false);
      if (selectedLead && selectedLead.id === leadToDelete.id) {
        setSelectedLead(null);
      }
      showToast(`Deleted ${leadToDelete.student_name} from database.`);
      setLeadToDelete(null);
      fetchLeads();
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  // DNC actions
  const handleMarkDNC = async (lead) => {
    try {
      await leadsService.markDNC(lead.id);
      showToast(`Marked ${lead.student_name} as Do Not Call (DNC).`);
      fetchLeads();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead({ ...selectedLead, is_dnc: true, lead_status: 'DNC' });
      }
    } catch (err) {
      alert('Failed updating DNC status');
    }
  };

  const handleUnmarkDNC = async (lead) => {
    try {
      await leadsService.unmarkDNC(lead.id);
      showToast(`Removed DNC status for ${lead.student_name}.`);
      fetchLeads();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead({ ...selectedLead, is_dnc: false, lead_status: 'New' });
      }
    } catch (err) {
      alert('Failed unmarking DNC status');
    }
  };

  // Follow-up
  const openFollowUpModal = (lead) => {
    setLeadForFollowUp(lead);
    setIsFollowUpModalOpen(true);
  };

  const handleScheduleFollowUp = async (e) => {
    e.preventDefault();
    if (!leadForFollowUp) return;
    try {
      await apiClient.post('/follow-ups', {
        lead_id: leadForFollowUp.id,
        student_name: leadForFollowUp.student_name,
        reason: followUpForm.reason,
        due_date: followUpForm.due_date,
        due_time: followUpForm.due_time,
        notes: followUpForm.notes
      });
      setIsFollowUpModalOpen(false);
      showToast(`Scheduled follow-up for ${leadForFollowUp.student_name} on ${followUpForm.due_date}!`);
    } catch (err) {
      alert('Failed to schedule follow-up');
    }
  };

  const resetForm = () => {
    setLeadForm({
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
  };

  const columns = [
    {
      header: 'Student Candidate',
      accessor: 'student_name',
      render: (r) => (
        <div>
          <button
            style={{ background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
            onClick={() => navigate(`/leads/${r.id}`)}
          >
            <strong style={{ fontSize: '14px', color: 'var(--gold-dark)', textDecoration: 'underline' }}>{r.student_name}</strong>
          </button>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
            {r.phone || 'No phone'} • {r.email || 'No email'}
          </div>
        </div>
      )
    },
    {
      header: 'Education',
      accessor: 'degree',
      render: (r) => `${r.degree || 'B.Tech'} (${r.branch || 'CSE'}, ${r.year || '3rd Year'})`
    },
    { header: 'Course Interest', accessor: 'interest' },
    {
      header: 'Lead Score',
      accessor: 'lead_score',
      render: (r) => <StatusBadge status={r.lead_score || 75} type="score" />
    },
    {
      header: 'Status',
      accessor: 'lead_status',
      render: (r) => r.is_dnc ? (
        <span style={{ background: '#FDE8E8', color: '#9B2C2C', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: '700', fontSize: '11px' }}>
          DNC (OPTED OUT)
        </span>
      ) : (
        <StatusBadge status={r.lead_status || 'New'} />
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            className="btn btn-gold"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            disabled={r.is_dnc}
            onClick={() => navigate(`/dialer?lead=${r.id}`)}
            title={r.is_dnc ? "Contact has opted out (DNC)" : "Call Lead"}
          >
            <Phone size={12} />
            <span>Call</span>
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => setSelectedLead(r)}
            title="Quick View"
          >
            <Eye size={13} />
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => openEditModal(r)}
            title="Edit Lead"
          >
            <Edit3 size={13} />
          </button>

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '12px' }}
            onClick={() => openFollowUpModal(r)}
            title="Schedule Follow-up"
          >
            <Calendar size={13} />
          </button>

          {!r.is_dnc ? (
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#9B2C2C', borderColor: '#FCA5A5' }}
              onClick={() => handleMarkDNC(r)}
              title="Mark as Do Not Call"
            >
              <ShieldAlert size={13} />
            </button>
          ) : (
            <button
              className="btn btn-outline"
              style={{ padding: '4px 8px', fontSize: '11px', color: '#047857', borderColor: '#6EE7B7' }}
              onClick={() => handleUnmarkDNC(r)}
              title="Unmark DNC"
            >
              <ShieldCheck size={13} />
            </button>
          )}

          <button
            className="btn btn-outline"
            style={{ padding: '4px 8px', fontSize: '12px', color: '#C53030' }}
            onClick={() => openDeleteModal(r)}
            title="Delete Lead"
          >
            <Trash2 size={13} />
          </button>
        </div>
      )
    }
  ];

  if (loading && leads.length === 0) return <LoadingSkeleton rows={6} type="table" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {toastMessage && (
        <div style={{ background: 'var(--bg-dark)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ width: '260px' }}>
            <Search size={15} style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search candidate, phone, course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
          >
            <option value="All">All Statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Interested">Interested</option>
            <option value="Qualified">Qualified</option>
            <option value="Workshop Registered">Workshop Registered</option>
            <option value="Converted">Converted</option>
            <option value="DNC">DNC (Opted Out)</option>
          </select>

          <select
            value={selectedInterest}
            onChange={(e) => setSelectedInterest(e.target.value)}
            style={{ padding: '8px 14px', borderRadius: 'var(--radius-full)', border: '1px solid var(--border-light)', background: 'var(--bg-card)' }}
          >
            <option value="All">All Courses</option>
            <option value="Data Science & AI">Data Science & AI</option>
            <option value="Full Stack Web Development">Full Stack Web Dev</option>
            <option value="Cloud Computing & DevOps">Cloud & DevOps</option>
            <option value="Cybersecurity Engineering">Cybersecurity</option>
          </select>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={() => leadsService.exportCSV()}>
            <Download size={15} />
            <span>EXPORT CSV</span>
          </button>
          <button className="btn btn-dark" onClick={() => setIsImportWizardOpen(true)}>
            <Upload size={15} />
            <span>IMPORT CSV</span>
          </button>
          <button className="btn btn-gold" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus size={16} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Main Table or Empty State */}
      {filteredLeads.length > 0 ? (
        <DataTable
          title={`Candidate Leads Directory (${filteredLeads.length})`}
          columns={columns}
          data={filteredLeads}
        />
      ) : (
        <EmptyState
          title="NO LEADS MATCHING FILTERS"
          message="Import candidate leads via CSV or create a new student lead profile."
          action={
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-gold" onClick={() => setIsImportWizardOpen(true)}>
                <Upload size={15} />
                <span>IMPORT LEADS (CSV)</span>
              </button>
              <button className="btn btn-dark" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
                <Plus size={15} />
                <span>Add Lead</span>
              </button>
            </div>
          }
        />
      )}

      {/* Lead Quick View Drawer */}
      <Drawer isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title={selectedLead?.student_name || 'Candidate Profile'}>
        {selectedLead && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                <StatusBadge status={selectedLead.lead_status} />
                <StatusBadge status={selectedLead.lead_score || 75} type="score" />
              </div>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Phone:</strong> {selectedLead.phone || 'N/A'}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Email:</strong> {selectedLead.email || 'N/A'}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Education:</strong> {selectedLead.degree} in {selectedLead.branch} ({selectedLead.year})</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Career Goal:</strong> {selectedLead.career_goal}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>Target Interest:</strong> {selectedLead.interest}</p>
              <p style={{ fontSize: '13px', marginBottom: '4px' }}><strong>DNC Opt-Out:</strong> {selectedLead.is_dnc ? 'YES 🚫' : 'NO ✅'}</p>
            </div>

            <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <h4 style={{ color: 'var(--gold-dark)', fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>AI Call Summary</h4>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{selectedLead.call_summary || 'No AI outbound call records found for this candidate yet.'}</p>
            </div>

            <div style={{ display: 'flex', gap: '10px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', flexWrap: 'wrap' }}>
              <button
                className="btn btn-gold"
                style={{ flex: 1 }}
                disabled={selectedLead.is_dnc}
                onClick={() => navigate(`/dialer?lead=${selectedLead.id}`)}
              >
                <Phone size={15} />
                <span>Call Candidate</span>
              </button>
              <button className="btn btn-outline" onClick={() => { setSelectedLead(null); openEditModal(selectedLead); }}>
                <Edit3 size={15} />
                <span>Edit</span>
              </button>
              <button className="btn btn-outline" onClick={() => navigate(`/leads/${selectedLead.id}`)}>
                <ExternalLink size={15} />
                <span>Full Profile</span>
              </button>
            </div>
          </div>
        )}
      </Drawer>

      {/* Add Lead Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Student Lead Candidate">
        <form onSubmit={handleCreateLead} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Student Full Name *</label>
              <input type="text" required placeholder="John Doe" value={leadForm.student_name} onChange={e => setLeadForm({ ...leadForm, student_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number *</label>
              <input type="text" required placeholder="+919876543210" value={leadForm.phone} onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Email Address</label>
              <input type="email" placeholder="student@example.com" value={leadForm.email} onChange={e => setLeadForm({ ...leadForm, email: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Course Interest</label>
              <select value={leadForm.interest} onChange={e => setLeadForm({ ...leadForm, interest: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Full Stack Web Development">Full Stack Web Dev</option>
                <option value="Cloud Computing & DevOps">Cloud & DevOps</option>
                <option value="Cybersecurity Engineering">Cybersecurity</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Degree</label>
              <input type="text" value={leadForm.degree} onChange={e => setLeadForm({ ...leadForm, degree: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Year</label>
              <input type="text" value={leadForm.year} onChange={e => setLeadForm({ ...leadForm, year: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Branch</label>
              <input type="text" value={leadForm.branch} onChange={e => setLeadForm({ ...leadForm, branch: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Candidate</button>
          </div>
        </form>
      </Modal>

      {/* Edit Lead Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Lead: ${leadToEdit?.student_name}`}>
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
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Lead Status</label>
              <select value={leadForm.lead_status} onChange={e => setLeadForm({ ...leadForm, lead_status: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Interested">Interested</option>
                <option value="Qualified">Qualified</option>
                <option value="Workshop Registered">Workshop Registered</option>
                <option value="Converted">Converted</option>
                <option value="Not Interested">Not Interested</option>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Degree</label>
              <input type="text" value={leadForm.degree} onChange={e => setLeadForm({ ...leadForm, degree: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Year</label>
              <input type="text" value={leadForm.year} onChange={e => setLeadForm({ ...leadForm, year: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Branch</label>
              <input type="text" value={leadForm.branch} onChange={e => setLeadForm({ ...leadForm, branch: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
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
          <p>Are you sure you want to permanently delete candidate <strong>{leadToDelete?.student_name}</strong>? This action cannot be undone.</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-dark" style={{ background: '#C53030' }} onClick={handleDeleteLead}>Delete Permanently</button>
          </div>
        </div>
      </Modal>

      {/* Schedule Follow-Up Modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title={`Schedule Follow-Up: ${leadForFollowUp?.student_name}`}>
        <form onSubmit={handleScheduleFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Reason for Follow-up *</label>
            <input type="text" required value={followUpForm.reason} onChange={e => setFollowUpForm({ ...followUpForm, reason: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Due Date *</label>
              <input type="date" required value={followUpForm.due_date} onChange={e => setFollowUpForm({ ...followUpForm, due_date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Due Time</label>
              <input type="text" value={followUpForm.due_time} onChange={e => setFollowUpForm({ ...followUpForm, due_time: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Notes</label>
            <textarea value={followUpForm.notes} onChange={e => setFollowUpForm({ ...followUpForm, notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', height: '70px' }} placeholder="Add call outcome notes..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFollowUpModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Schedule Follow-up</button>
          </div>
        </form>
      </Modal>

      {/* CSV Import Wizard */}
      <ImportWizard
        isOpen={isImportWizardOpen}
        onClose={() => {
          setIsImportWizardOpen(false);
          fetchLeads();
        }}
        onImportComplete={() => {
          setSearchQuery('');
          setSelectedStatus('All');
          setSelectedInterest('All');
          fetchLeads();
        }}
      />
    </div>
  );
}
