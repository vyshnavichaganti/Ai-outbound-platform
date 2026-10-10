import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import {
  Bot, Mic, Globe, Sparkles, CheckCircle2, ShieldCheck,
  Play, Plus, Edit3, Power, ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Agents() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [agentForm, setAgentForm] = useState({
    name: '',
    role: 'Career Counselor',
    language: 'english',
    voice: 'Priya (ElevenLabs)',
    greeting: "Hello! I'm Priya, your AI career counselor. How can I assist with your career path today?",
    system_prompt: 'You are an expert AI Career Counselor. Counsel students on tech courses, placement support, and career trajectories.',
    objectives: 'Qualify student leads, assess career goals, recommend suitable courses, and invite for masterclass workshops.',
    is_active: true
  });

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/agents');
      setAgents(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const openCreateModal = () => {
    setSelectedAgent(null);
    setAgentForm({
      name: '',
      role: 'Career Counselor',
      language: 'english',
      voice: 'Priya (ElevenLabs)',
      greeting: "Hello! I'm Priya, your AI career counselor. How can I assist with your career path today?",
      system_prompt: 'You are an expert AI Career Counselor.',
      objectives: 'Qualify student leads and recommend suitable courses.',
      is_active: true
    });
    setIsModalOpen(true);
  };

  const openEditModal = (agent) => {
    setSelectedAgent(agent);
    setAgentForm({
      name: agent.name || '',
      role: agent.role || 'Career Counselor',
      language: agent.language || 'english',
      voice: agent.voice || 'Priya (ElevenLabs)',
      greeting: agent.greeting || '',
      system_prompt: agent.system_prompt || '',
      objectives: agent.objectives || '',
      is_active: agent.is_active
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedAgent) {
        await apiClient.put(`/agents/${selectedAgent.id}`, agentForm);
        showToast(`Updated agent '${agentForm.name}'!`);
      } else {
        await apiClient.post('/agents', agentForm);
        showToast(`Created agent '${agentForm.name}'!`);
      }
      setIsModalOpen(false);
      loadAgents();
    } catch (err) {
      alert('Failed saving agent configuration');
    }
  };

  const handleToggleActivate = async (agent) => {
    try {
      const action = agent.is_active ? 'deactivate' : 'activate';
      const res = await apiClient.post(`/agents/${agent.id}/${action}`);
      showToast(res.message);
      loadAgents();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed toggling agent status');
    }
  };

  if (loading && agents.length === 0) return <LoadingSkeleton rows={4} />;

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
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Voice Agents & Personalities</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Configure AI counseling agents, language models, voice synthesis engines, and system prompts.
          </p>
        </div>

        <button className="btn btn-gold" onClick={openCreateModal}>
          <Plus size={16} />
          <span>NEW AI AGENT</span>
        </button>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '24px' }}>
        {agents.map((agent) => (
          <div key={agent.id} className="glass-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--gold-gradient)', color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-gold)' }}>
                    <Bot size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: '700' }}>{agent.name}</h3>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>{agent.role}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className={`badge-gold ${agent.is_active ? '' : 'badge-disabled'}`}>
                    ● {agent.is_active ? 'Active' : 'Inactive'}
                  </span>
                  <button className="btn btn-outline" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openEditModal(agent)}>
                    <Edit3 size={13} />
                  </button>
                </div>
              </div>

              {/* Specs */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#FAF8F3', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', marginBottom: '16px', fontSize: '12.5px' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '600' }}>Language</span>
                  <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{agent.language}</p>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: '600' }}>Voice Engine</span>
                  <p style={{ fontWeight: '700', color: 'var(--gold-dark)' }}>{agent.voice}</p>
                </div>
              </div>

              {/* Greeting */}
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Opening Greeting:</span>
                <p style={{ background: '#FFF', padding: '10px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', fontSize: '12.5px', fontStyle: 'italic', marginTop: '4px' }}>
                  "{agent.greeting}"
                </p>
              </div>

              {/* Objectives */}
              <div style={{ marginBottom: '20px' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Agent Objectives:</span>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {agent.objectives || 'Counsel student leads and qualify interest.'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={() => navigate('/counselor')}>
                <Play size={14} />
                <span>Test Chat</span>
              </button>

              <button
                className={`btn ${agent.is_active ? 'btn-outline' : 'btn-dark'}`}
                style={{ fontSize: '12px' }}
                onClick={() => handleToggleActivate(agent)}
              >
                <Power size={13} />
                <span>{agent.is_active ? 'Deactivate' : 'Activate'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedAgent ? `Edit Agent: ${selectedAgent.name}` : 'Create New AI Agent'}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Agent Name *</label>
            <input type="text" required value={agentForm.name} onChange={e => setAgentForm({ ...agentForm, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Role</label>
              <input type="text" value={agentForm.role} onChange={e => setAgentForm({ ...agentForm, role: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Voice Engine</label>
              <input type="text" value={agentForm.voice} onChange={e => setAgentForm({ ...agentForm, voice: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Opening Greeting</label>
            <textarea value={agentForm.greeting} onChange={e => setAgentForm({ ...agentForm, greeting: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #DDD', height: '50px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>System Prompt</label>
            <textarea value={agentForm.system_prompt} onChange={e => setAgentForm({ ...agentForm, system_prompt: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #DDD', height: '60px' }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Objectives</label>
            <textarea value={agentForm.objectives} onChange={e => setAgentForm({ ...agentForm, objectives: e.target.value })} style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #DDD', height: '50px' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Agent</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
