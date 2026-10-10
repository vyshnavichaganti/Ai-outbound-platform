import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();

  const getHeaderMeta = () => {
    const path = location.pathname;
    if (path === '/') {
      return {
        title: 'Command Center',
        subtitle: 'Real-time operational dashboard for AI outbound calling operations.'
      };
    }
    if (path.startsWith('/dialer')) {
      return {
        title: 'AI Dialer & Call Control Room',
        subtitle: 'Initiate Twilio PSTN AI calls, inspect live transcripts, and capture AI insights.'
      };
    }
    if (path.startsWith('/live-calls')) {
      return {
        title: 'Live Calls Wallboard',
        subtitle: 'Real-time monitoring for ongoing AI voice sessions.'
      };
    }
    if (path.startsWith('/call-queue')) {
      return {
        title: 'Call Queue Operations',
        subtitle: 'Manage outbound call queues, retry schedules, and lead priorities.'
      };
    }
    if (path.startsWith('/leads')) {
      return {
        title: 'Student Leads CRM',
        subtitle: 'Manage candidate pipeline, lead scores, and call qualification stages.'
      };
    }
    if (path.startsWith('/contacts')) {
      return {
        title: 'Contact Database',
        subtitle: 'Directory of raw contact phone records for outbound campaigns.'
      };
    }
    if (path.startsWith('/campaigns')) {
      return {
        title: 'Outbound Calling Campaigns',
        subtitle: 'Create, schedule, and run automated AI calling drives.'
      };
    }
    if (path.startsWith('/agents')) {
      return {
        title: 'AI Agents & Personalities',
        subtitle: 'Configure Priya AI voice agent, language, and counseling scripts.'
      };
    }
    if (path.startsWith('/conversations')) {
      return {
        title: 'AI Conversation Inspector',
        subtitle: 'Review full speech transcripts, Gemini AI turns, and summaries.'
      };
    }
    if (path.startsWith('/knowledge-base')) {
      return {
        title: 'AI Knowledge Base',
        subtitle: 'Manage courses, FAQs, and masterclass data used by Priya AI.'
      };
    }
    if (path.startsWith('/follow-ups')) {
      return {
        title: 'Follow-ups & Callbacks',
        subtitle: 'Track scheduled callbacks and student follow-up reminders.'
      };
    }
    if (path.startsWith('/calls')) {
      return {
        title: 'Call History Logs',
        subtitle: 'Review Twilio call records, call SIDs, and outcomes.'
      };
    }
    if (path.startsWith('/workshops')) {
      return {
        title: 'Workshops & Masterclasses',
        subtitle: 'Manage live webinars and registered student seats.'
      };
    }
    if (path.startsWith('/analytics')) {
      return {
        title: 'Call Center Analytics',
        subtitle: 'Deep performance metrics, call duration trends, and qualification rates.'
      };
    }
    if (path.startsWith('/reports')) {
      return {
        title: 'Executive Reports',
        subtitle: 'Generate daily, weekly, and campaign call summary reports.'
      };
    }
    if (path.startsWith('/settings')) {
      return {
        title: 'Platform Settings',
        subtitle: 'Monitor Twilio gateway, Gemini AI API key, and SQLite connectivity.'
      };
    }
    return { title: 'AI Outbound Platform', subtitle: 'AI Career Counselor Voice Agent' };
  };

  const { title, subtitle } = getHeaderMeta();

  return (
    <div className="app-layout">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div
        className="main-wrapper"
        style={{
          marginLeft: sidebarCollapsed ? 'var(--sidebar-width-collapsed)' : 'var(--sidebar-width-expanded)'
        }}
      >
        <Topbar title={title} subtitle={subtitle} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
