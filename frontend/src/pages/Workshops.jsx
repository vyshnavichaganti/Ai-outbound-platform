import React, { useState, useEffect } from 'react';
import { workshopsService } from '../services/workshopsService';
import { leadsService } from '../services/leadsService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Calendar, Clock, MapPin, Users, Plus, CheckCircle, Sparkles } from 'lucide-react';

export default function Workshops() {
  const [workshops, setWorkshops] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const [registerForm, setRegisterForm] = useState({
    student_name: '',
    phone: '',
    workshop_name: ''
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [wsData, leadData] = await Promise.all([
          workshopsService.getWorkshops(),
          leadsService.getLeads()
        ]);
        setWorkshops(wsData);
        setLeads(leadData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleRegisterStudent = async (e) => {
    e.preventDefault();
    if (!registerForm.student_name || !registerForm.workshop_name) return;
    await workshopsService.register(registerForm);
    setToastMessage(`Successfully registered ${registerForm.student_name} for ${registerForm.workshop_name}!`);
    setIsRegisterModalOpen(false);
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (loading) return <LoadingSkeleton rows={4} />;

  // Filter registrations from leads database
  const registrationRows = leads
    .filter(l => l.workshop_registered || l.lead_status === 'Qualified' || l.lead_status === 'Converted')
    .map(l => ({
      id: l.id,
      student_name: l.student_name,
      phone: l.phone,
      workshop: l.interest ? `${l.interest} Masterclass` : 'AI Career Workshop',
      reg_date: l.created_at || '2026-10-09',
      attendance: 'Confirmed Seat',
      status: 'Registered'
    }));

  const columns = [
    { header: 'Student Name', accessor: 'student_name', render: (row) => <strong>{row.student_name}</strong> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Workshop Title', accessor: 'workshop' },
    { header: 'Registration Date', accessor: 'reg_date' },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => (
        <span style={{ background: '#EAF7EE', color: '#1E7E34', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontWeight: '600', fontSize: '12px' }}>
          {row.status}
        </span>
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

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Upcoming Masterclasses & Workshops</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Live interactive career webinars offered to students during AI voice counseling sessions.
          </p>
        </div>
        <button className="btn btn-gold" onClick={() => setIsRegisterModalOpen(true)}>
          <Plus size={16} />
          <span>Register Student</span>
        </button>
      </div>

      {/* Workshop Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        {workshops.map((ws, idx) => (
          <div key={idx} className="glass-card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <span className="badge-gold">{ws.status || 'Filling Fast'}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
                <Users size={14} />
                <span>{ws.registered || 84} / {ws.seats || 100} Seats</span>
              </div>
            </div>

            <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>{ws.name}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Calendar size={15} style={{ color: 'var(--gold-dark)' }} />
                <span>Date: <strong>{ws.date}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={15} style={{ color: 'var(--gold-dark)' }} />
                <span>Time: <strong>{ws.time || '6:00 PM IST'}</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} style={{ color: 'var(--gold-dark)' }} />
                <span>Mode: <strong>{ws.mode || 'Online Live'}</strong></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-gold"
                style={{ flex: 1 }}
                onClick={() => {
                  setSelectedWorkshop(ws);
                  setRegisterForm(prev => ({ ...prev, workshop_name: ws.name }));
                  setIsRegisterModalOpen(true);
                }}
              >
                Register Student
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Workshop Registrations Table */}
      <DataTable
        title={`Live Student Registrations (${registrationRows.length})`}
        columns={columns}
        data={registrationRows}
      />

      {/* Register Student Modal */}
      <Modal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        title="Register Student for Workshop"
      >
        <form onSubmit={handleRegisterStudent} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Workshop Title</label>
            <input
              type="text"
              required
              value={registerForm.workshop_name}
              onChange={(e) => setRegisterForm({ ...registerForm, workshop_name: e.target.value })}
              placeholder="e.g. Data Science & AI Career Masterclass"
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Student Name</label>
            <input
              type="text"
              required
              placeholder="Student full name"
              value={registerForm.student_name}
              onChange={(e) => setRegisterForm({ ...registerForm, student_name: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number</label>
            <input
              type="text"
              required
              placeholder="+91 98765 43210"
              value={registerForm.phone}
              onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsRegisterModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Confirm Registration</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
