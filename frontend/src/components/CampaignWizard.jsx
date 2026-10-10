import React, { useState } from 'react';
import apiClient from '../services/api';
import { Layers, Bot, Clock, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

export default function CampaignWizard({ isOpen, onClose, onCampaignCreated }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: 'B.Tech Data Science & AI Outbound Drive',
    target_audience: '3rd & 4th Year B.Tech Students',
    course_interest: 'Data Science & AI',
    agent: 'Priya AI Counselor',
    max_attempts: 3,
    retry_delay: '30 minutes',
    calling_hours: '9:00 AM - 7:00 PM',
    skip_dnc: true
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.post('/campaigns', form);
      if (onCampaignCreated) onCampaignCreated();
      onClose();
    } catch (err) {
      alert('Failed creating campaign');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '700' }}>Create AI Calling Campaign</h3>
          <button onClick={onClose} style={{ color: 'var(--text-muted)', border: 'none', background: 'transparent', cursor: 'pointer' }}>✕</button>
        </div>

        <div className="wizard-steps">
          <div className={`step-pill ${step === 1 ? 'active' : step > 1 ? 'completed' : ''}`}>1. Basics</div>
          <div className={`step-pill ${step === 2 ? 'active' : step > 2 ? 'completed' : ''}`}>2. Agent</div>
          <div className={`step-pill ${step === 3 ? 'active' : step > 3 ? 'completed' : ''}`}>3. Calling Rules</div>
          <div className={`step-pill ${step === 4 ? 'active' : ''}`}>4. Launch</div>
        </div>

        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Campaign Name *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Target Audience</label>
              <input type="text" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Course Focus</label>
              <select value={form.course_interest} onChange={e => setForm({ ...form, course_interest: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
                <option value="Data Science & AI">Data Science & AI</option>
                <option value="Full Stack Development">Full Stack Development</option>
                <option value="Generative AI & LLMs">Generative AI & LLMs</option>
              </select>
            </div>
            <button className="btn btn-gold" style={{ alignSelf: 'flex-end', marginTop: '12px' }} onClick={() => setStep(2)}>Next: Select Agent <ArrowRight size={14} /></button>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Assign AI Voice Agent</h4>
            <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Bot size={32} style={{ color: 'var(--gold-dark)' }} />
              <div>
                <h4 style={{ fontSize: '16px', fontWeight: '700' }}>Priya AI — Career Counselor</h4>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Voice: ElevenLabs English (India) • Specialized in B.Tech Course Counseling</p>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setStep(1)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={() => setStep(3)}>Next: Calling Rules <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '13px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Compliance & Calling Strategy</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Max Retry Attempts</label>
                <input type="number" value={form.max_attempts} onChange={e => setForm({ ...form, max_attempts: Number(e.target.value) })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Retry Delay</label>
                <input type="text" value={form.retry_delay} onChange={e => setForm({ ...form, retry_delay: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: '600', marginBottom: '4px' }}>Allowed Calling Hours</label>
              <input type="text" value={form.calling_hours} onChange={e => setForm({ ...form, calling_hours: e.target.value })} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #DDD' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <input type="checkbox" id="skipdnc" checked={form.skip_dnc} onChange={e => setForm({ ...form, skip_dnc: e.target.checked })} />
              <label htmlFor="skipdnc" style={{ fontWeight: '600' }}>Enforce Do Not Call (DNC) List Opt-Out Protection</label>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <button className="btn btn-outline" onClick={() => setStep(2)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={() => setStep(4)}>Review & Launch <ArrowRight size={14} /></button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '15px', fontWeight: '700' }}>Campaign Summary Review</h4>
            <div style={{ background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <p><strong>Campaign Name:</strong> {form.name}</p>
              <p><strong>Target Audience:</strong> {form.target_audience}</p>
              <p><strong>Assigned Agent:</strong> {form.agent}</p>
              <p><strong>Max Attempts:</strong> {form.max_attempts} retries</p>
              <p><strong>DNC Opt-Out Compliance:</strong> {form.skip_dnc ? 'Enforced ✅' : 'Disabled ⚠️'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <button className="btn btn-outline" onClick={() => setStep(3)}><ArrowLeft size={14} /> Back</button>
              <button className="btn btn-gold" onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Launching...' : 'Launch Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
