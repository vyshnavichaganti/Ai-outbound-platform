import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Modal from '../components/Modal';
import {
  BookOpen, GraduationCap, Calendar, HelpCircle, FileText,
  Upload, Trash2, Plus, Sparkles, CheckCircle2
} from 'lucide-react';

export default function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isFAQModalOpen, setIsFAQModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const [faqForm, setFaqForm] = useState({
    question: '',
    answer: '',
    category: 'General'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [docRes, faqRes, courseRes] = await Promise.all([
        apiClient.get('/knowledge/documents'),
        apiClient.get('/knowledge/faqs'),
        apiClient.get('/counselor/courses')
      ]);
      setDocuments(Array.isArray(docRes) ? docRes : []);
      setFaqs(Array.isArray(faqRes) ? faqRes : []);
      setCourses(courseRes.courses || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/knowledge/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast(res.message || 'Document uploaded and indexed!');
      loadData();
    } catch (err) {
      alert(err.response?.data?.detail || 'Failed uploading document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (id, filename) => {
    try {
      await apiClient.delete(`/knowledge/documents/${id}`);
      showToast(`Document '${filename}' deleted.`);
      loadData();
    } catch (err) {
      alert('Failed deleting document');
    }
  };

  const handleCreateFAQ = async (e) => {
    e.preventDefault();
    if (!faqForm.question || !faqForm.answer) return;
    try {
      await apiClient.post('/knowledge/faqs', faqForm);
      setIsFAQModalOpen(false);
      setFaqForm({ question: '', answer: '', category: 'General' });
      showToast('New FAQ added to AI Knowledge Base!');
      loadData();
    } catch (err) {
      alert('Failed adding FAQ');
    }
  };

  const handleDeleteFAQ = async (id) => {
    try {
      await apiClient.delete(`/knowledge/faqs/${id}`);
      showToast('FAQ deleted.');
      loadData();
    } catch (err) {
      alert('Failed deleting FAQ');
    }
  };

  if (loading && documents.length === 0 && faqs.length === 0) return <LoadingSkeleton rows={4} />;

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
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Knowledge Base & Grounding Data</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Upload PDFs/TXT documents and manage FAQs used by Gemini AI during student voice counseling.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <label className="btn btn-dark" style={{ cursor: 'pointer' }}>
            <Upload size={15} />
            <span>{isUploading ? 'Uploading...' : 'UPLOAD PDF / TXT'}</span>
            <input type="file" accept=".pdf,.txt,.md" onChange={handleFileUpload} style={{ display: 'none' }} disabled={isUploading} />
          </label>

          <button className="btn btn-gold" onClick={() => setIsFAQModalOpen(true)}>
            <Plus size={16} />
            <span>ADD FAQ</span>
          </button>
        </div>
      </div>

      {/* RAG Knowledge Documents Table */}
      <div className="table-container" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText size={18} style={{ color: 'var(--gold-dark)' }} />
          Uploaded RAG Knowledge Documents ({documents.length})
        </h3>
        {documents.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {documents.map((doc) => (
              <div key={doc.id} style={{ background: '#FAF8F3', padding: '14px 18px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{doc.filename}</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Format: {doc.file_type.toUpperCase()} • Size: {Math.round(doc.file_size / 1024)} KB • Uploaded {doc.created_at}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', fontStyle: 'italic' }}>
                    "{doc.content_summary.slice(0, 150)}..."
                  </p>
                </div>
                <button className="btn btn-outline" style={{ color: '#C53030', borderColor: '#FEB2B2', padding: '6px 10px' }} onClick={() => handleDeleteDoc(doc.id, doc.filename)}>
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 }}>
            No external PDF or TXT documents uploaded yet. Upload course syllabus or policy PDFs to expand AI knowledge.
          </p>
        )}
      </div>

      {/* Counseling FAQs Section */}
      <div className="table-container" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <HelpCircle size={18} style={{ color: 'var(--gold-dark)' }} />
          Active Counseling FAQs ({faqs.length})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {faqs.map((faq) => (
            <div key={faq.id} className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'center' }}>
                  <span className="badge-gold">{faq.category || 'General'}</span>
                  <button className="btn btn-outline" style={{ padding: '2px 6px', fontSize: '11px', color: '#C53030' }} onClick={() => handleDeleteFAQ(faq.id)}>
                    <Trash2 size={12} />
                  </button>
                </div>
                <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '6px' }}>{faq.question}</h4>
                <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add FAQ Modal */}
      <Modal isOpen={isFAQModalOpen} onClose={() => setIsFAQModalOpen(false)} title="Add New FAQ to Knowledge Base">
        <form onSubmit={handleCreateFAQ} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Category</label>
            <select value={faqForm.category} onChange={e => setFaqForm({ ...faqForm, category: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }}>
              <option value="General">General Inquiry</option>
              <option value="Fees & Budget">Fees & Budget</option>
              <option value="Placements & Salary">Placements & Salary</option>
              <option value="Course Format">Course Format & Mode</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Student Question *</label>
            <input type="text" required value={faqForm.question} onChange={e => setFaqForm({ ...faqForm, question: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD' }} placeholder="e.g. What is the placement guarantee?" />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Grounding Answer *</label>
            <textarea required value={faqForm.answer} onChange={e => setFaqForm({ ...faqForm, answer: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #DDD', height: '80px' }} placeholder="e.g. We provide 100% placement assistance..." />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '10px' }}>
            <button type="button" className="btn btn-outline" onClick={() => setIsFAQModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-gold">Save FAQ</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
