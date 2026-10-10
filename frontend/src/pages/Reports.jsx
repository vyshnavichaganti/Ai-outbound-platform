import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  FileText, Download, Users, PhoneCall, Layers,
  CalendarCheck, Sparkles, Filter
} from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('leads'); // leads, calls, campaigns, follow-ups
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');

  const loadReport = async (type) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/reports/${type}`);
      setReportData(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error(err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport(activeTab);
  }, [activeTab]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleExportCSV = async () => {
    try {
      const response = await apiClient.get(`/reports/${activeTab}/export`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}_report.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      showToast(`Exported ${activeTab.toUpperCase()} report to CSV!`);
    } catch (err) {
      alert('Failed exporting report');
    }
  };

  // Define columns per report type
  const leadColumns = [
    { header: 'Student Name', accessor: 'student_name', render: r => <strong>{r.student_name}</strong> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Email', accessor: 'email' },
    { header: 'Degree', accessor: 'degree' },
    { header: 'Course Interest', accessor: 'interest' },
    { header: 'Status', accessor: 'lead_status', render: r => <StatusBadge status={r.lead_status} /> },
    { header: 'DNC Opt-Out', accessor: 'is_dnc', render: r => r.is_dnc ? 'YES 🚫' : 'NO ✅' },
    { header: 'Created At', accessor: 'created_at' }
  ];

  const callColumns = [
    { header: 'Call SID', accessor: 'call_sid' },
    { header: 'Student Name', accessor: 'student_name', render: r => <strong>{r.student_name}</strong> },
    { header: 'Phone', accessor: 'phone' },
    { header: 'Duration', accessor: 'duration', render: r => `${Math.floor((r.duration || 0) / 60)}m ${(r.duration || 0) % 60}s` },
    { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Intent Level', accessor: 'intent' },
    { header: 'Summary', accessor: 'summary', render: r => (r.summary || '').slice(0, 80) + '...' },
    { header: 'Created At', accessor: 'created_at' }
  ];

  const campaignColumns = [
    { header: 'Campaign Name', accessor: 'name', render: r => <strong>{r.name}</strong> },
    { header: 'Course Target', accessor: 'course_interest' },
    { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Total Contacts', accessor: 'total_contacts' },
    { header: 'Created At', accessor: 'created_at' }
  ];

  const followupColumns = [
    { header: 'Student Name', accessor: 'student_name', render: r => <strong>{r.student_name}</strong> },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Due Date', accessor: 'due_date' },
    { header: 'Due Time', accessor: 'due_time' },
    { header: 'Status', accessor: 'status', render: r => <StatusBadge status={r.status} /> },
    { header: 'Created At', accessor: 'created_at' }
  ];

  const getColumns = () => {
    switch (activeTab) {
      case 'calls': return callColumns;
      case 'campaigns': return campaignColumns;
      case 'follow-ups': return followupColumns;
      default: return leadColumns;
    }
  };

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
          <h2 style={{ fontSize: '20px', fontWeight: '700' }}>Platform Executive Reports & CSV Export</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
            Generate and export real database reports for Leads, Calls, Campaigns, and Follow-ups.
          </p>
        </div>

        <button className="btn btn-gold" onClick={handleExportCSV}>
          <Download size={16} />
          <span>EXPORT {activeTab.toUpperCase()} REPORT (CSV)</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
        <button
          className={`btn ${activeTab === 'leads' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('leads')}
        >
          <Users size={15} />
          <span>Lead Report</span>
        </button>

        <button
          className={`btn ${activeTab === 'calls' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('calls')}
        >
          <PhoneCall size={15} />
          <span>Call Report</span>
        </button>

        <button
          className={`btn ${activeTab === 'campaigns' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('campaigns')}
        >
          <Layers size={15} />
          <span>Campaign Report</span>
        </button>

        <button
          className={`btn ${activeTab === 'follow-ups' ? 'btn-gold' : 'btn-outline'}`}
          onClick={() => setActiveTab('follow-ups')}
        >
          <CalendarCheck size={15} />
          <span>Follow-up Report</span>
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingSkeleton rows={5} type="table" />
      ) : reportData.length > 0 ? (
        <DataTable
          title={`${activeTab.toUpperCase()} Database Report (${reportData.length} Records)`}
          columns={getColumns()}
          data={reportData}
        />
      ) : (
        <EmptyState
          title={`No ${activeTab.toUpperCase()} Records Found`}
          message={`No ${activeTab} data available in database to generate report.`}
          action={<button className="btn btn-gold" onClick={handleExportCSV}>Export CSV</button>}
        />
      )}
    </div>
  );
}
