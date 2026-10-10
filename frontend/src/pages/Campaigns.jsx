import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import CampaignWizard from '../components/CampaignWizard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import {
  Layers, Play, Pause, Plus, ArrowRight, CheckCircle2,
  Trash2, Edit3, Sparkles, UserCheck, ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Campaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    target_audience: 'B.Tech Students',
    course_interest: 'Data Science & AI',
    agent_id: 'priya',
    language: 'english',
    status: 'Draft'
  });

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/campaigns');
      setCampaigns(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCampaigns();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleToggleStatus = async (camp) => {
    try {
      if (camp.status === 'Running') {
        await apiClient.post(`/campaigns/${camp.id}/pause`);
        showToast(`Campaign '${camp.name}' paused.`);
      } else {
        const res = await apiClient.post(`/campaigns/${camp.id}/launch`);
        showToast(res.message || `Campaign '${camp.name}' launched!`);
      }
      loadCampaigns();
    } catch (err) {
      alert('Failed toggling campaign status');
    }
  };

  const openEditModal = (camp) => {
    setSelectedCamp(camp);
    setEditForm({
      name: camp.name || '',
      description: camp.description || '',
      target_audience: camp.target_audience || 'B.Tech Students',
      course_interest: camp.course_interest || 'Data Science & AI',
      agent_id: camp.agent_id || 'priya',
      language: camp.language || 'english',
      status: camp.status || 'Draft'
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateCampaign = async (e) => {
    e.preventDefault();
    if (!selectedCamp) return;
    try {
      await apiClient.put(`/campaigns/${selectedCamp.id}`, editForm);
      setIsEditModalOpen(false);
      showToast(`Campaign '${editForm.name}' updated!`);
      loadCampaigns();
    } catch (err) {
      alert('Failed updating campaign');
    }
  };

  const openDeleteModal = (camp) => {
    setSelectedCamp(camp);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteCampaign = async () => {
    if (!selectedCamp) return;
    try {
      await apiClient.delete(`/campaigns/${selectedCamp.id}`);
      setIsDeleteModalOpen(false);
      showToast(`Campaign deleted.`);
      loadCampaigns();
    } catch (err) {
      alert('Failed deleting campaign');
    }
  };

  if (loading && campaigns.length === 0) return <LoadingSkeleton rows={4} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {toastMessage && (
        <div style={{ background: 'var(--bg-dark)', color: '#FFF', padding: '12px 20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sparkles size={18} style={{ color: 'var(--gold-primary)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Outbound Calling Campaigns</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Automate voice calling drives with Priya AI counselor agent, lead qualification, and real DB analytics.
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => setIsWizardOpen(true)}>
          <Plus size={16} />
          <span>NEW CAMPAIGN</span>
        </button>
      </div>

      {campaigns.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          {campaigns.map((camp) => (
            <div key={camp.id} className="glass-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <StatusBadge status={camp.status || 'Draft'} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openEditModal(camp)}>
                      <Edit3 size={13} />
                    </button>
                    <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px', color: '#C53030' }} onClick={() => openDeleteModal(camp)}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>{camp.name}</h3>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  {camp.description || camp.target_audience}
                </p>

                {/* Dashboard Metrics Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#FAF8F3', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '18px', textAlign: 'center' }}>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Total</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{camp.total_contacts || 0}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Calls</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', marginTop: '2px' }}>{camp.calls_made || 0}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Connected</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#2B6CB0', marginTop: '2px' }}>{camp.connected || 0}</h4>
                  </div>
                  <div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600' }}>Qualified</span>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', color: '#1E7E34', marginTop: '2px' }}>{camp.qualified || 0}</h4>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className={`btn ${camp.status === 'Running' ? 'btn-dark' : 'btn-gold'}`}
                  style={{ flex: 1 }}
                  onClick={() => handleToggleStatus(camp)}
                >
                  {camp.status === 'Running' ? <Pause size={15} /> : <Play size={15} />}
                  <span>{camp.status === 'Running' ? 'Pause Campaign' : 'Launch Campaign'}</span>
                </button>
                <button className="btn btn-outline" onClick={() => navigate('/call-queue')}>
                  <span>Call Queue</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No Outbound Campaigns Created"
          message="Create your first campaign to launch automated AI calling drives."
          action={<button className="btn btn-gold" onClick={() => setIsWizardOpen(true)}>Create Campaign</button>}
        />
      )}

      {/* Campaign Setup Wizard */}
      <CampaignWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onCampaignCreated={() => loadCampaigns()}
      />

      {/* Edit Campaign Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={`Edit Campaign: ${selectedCamp?.name}`}>
        <form onSubmit={handleUpdateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Campaign Name *</label>
            <input type="text" required value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Description</label>
            <textarea value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', height: '60px' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Course Interest</label>
              <select value={editForm.course_interest} onChange={e => setEditForm({ ...editForm, course_interest: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Full Stack Web Development">Full Stack Web Dev</option>
                <option value="Cloud Computing & DevOps">Cloud & DevOps</option>
                <option value="Cybersecurity Engineering">Cybersecurity</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Status</label>
              <select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="Draft">Draft</option>
                <option value="Ready">Ready</option>
                <option value="Running">Running</option>
                <option value="Paused">Paused</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Confirm Delete Campaign">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p>Are you sure you want to delete campaign <strong>{selectedCamp?.name}</strong>?</p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
            <button className="btn btn-dark" style={{ background: '#C53030' }} onClick={handleDeleteCampaign}>Delete Campaign</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
