import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { Contact2, Plus, Upload, Phone, Mail, GraduationCap } from 'lucide-react';

export default function Contacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '', email: '', education: 'B.Tech CSE' });

  const loadContacts = async () => {
    try {
      const res = await apiClient.get('/contacts');
      setContacts(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newContact.name || !newContact.phone) return;
    await apiClient.post('/contacts', newContact);
    setIsModalOpen(false);
    setNewContact({ name: '', phone: '', email: '', education: 'B.Tech CSE' });
    loadContacts();
  };

  if (loading) return <LoadingSkeleton rows={5} type="table" />;

  const columns = [
    { header: 'Contact Name', accessor: 'name', render: (row) => <strong>{row.name}</strong> },
    { header: 'Phone Number', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Education', accessor: 'education' },
    { header: 'Source', accessor: 'source' },
    {
      header: 'Actions',
      accessor: 'id',
      render: (row) => (
        <a href="/dialer" className="btn btn-gold" style={{ padding: '4px 10px', fontSize: '12px' }}>
          <Phone size={12} />
          <span>Call Candidate</span>
        </a>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Contact Database</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Raw student leads & phone numbers available for outbound AI calling.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-gold" onClick={() => setIsModalOpen(true)}>
            <Plus size={16} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        title={`All Contacts (${contacts.length})`}
        columns={columns}
        data={contacts}
      />

      {/* Add Contact Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Contact to Database">
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Candidate Name</label>
            <input
              type="text"
              required
              placeholder="Candidate Name"
              value={newContact.name}
              onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Phone Number</label>
            <input
              type="text"
              required
              placeholder="+91 98765 43210"
              value={newContact.phone}
              onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Education</label>
            <input
              type="text"
              value={newContact.education}
              onChange={(e) => setNewContact({ ...newContact, education: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save Contact</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
