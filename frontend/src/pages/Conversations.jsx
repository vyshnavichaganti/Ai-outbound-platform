import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import Drawer from '../components/Drawer';
import AIMessage from '../components/AIMessage';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { MessageSquare, Bot, User, Clock, ChevronRight } from 'lucide-react';

export default function Conversations() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await apiClient.get('/call-logs');
        setConversations(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} type="table" />;

  const columns = [
    { header: 'Student Name', accessor: 'student_name', render: (r) => <strong>{r.student_name || 'Candidate'}</strong> },
    { header: 'Session / Call SID', accessor: 'session_id' },
    { header: 'Agent', accessor: 'worker', render: (r) => r.worker || 'Priya AI' },
    { header: 'Outcome Status', accessor: 'status', render: (r) => <StatusBadge status={r.status || 'completed'} /> },
    { header: 'Course Recommended', accessor: 'course_recommended', render: (r) => r.course_recommended || 'Data Science' },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSelectedConv(r)}>
          Inspect Turns
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Conversation Turn Inspector</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
          Inspect individual speech turns, Gemini AI reasoning, and candidate responses.
        </p>
      </div>

      <DataTable
        title={`All Conversation Logs (${conversations.length})`}
        columns={columns}
        data={conversations}
        onRowClick={(r) => setSelectedConv(r)}
      />

      <Drawer isOpen={!!selectedConv} onClose={() => setSelectedConv(null)} title={`Conversation — ${selectedConv?.student_name}`}>
        {selectedConv && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ background: 'var(--gold-soft)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--gold-border)' }}>
              <h4 style={{ color: 'var(--gold-dark)', fontSize: '14px', fontWeight: '700', marginBottom: '4px' }}>AI Counselor Summary</h4>
              <p style={{ fontSize: '13.5px' }}>{selectedConv.summary || selectedConv.ai_response || 'Turn completed with candidate.'}</p>
            </div>

            <div>
              <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>Speech Turn History</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: '#FAF8F3', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <AIMessage speaker="Priya (AI Counselor)" text={selectedConv.ai_response || "Hello! I'm Priya, your career counselor. How can I assist with your tech career today?"} />
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
