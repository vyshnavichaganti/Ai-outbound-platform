import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Dialer from './pages/Dialer';
import LiveCalls from './pages/LiveCalls';
import CallQueue from './pages/CallQueue';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Contacts from './pages/Contacts';
import Campaigns from './pages/Campaigns';
import Agents from './pages/Agents';
import Conversations from './pages/Conversations';
import KnowledgeBase from './pages/KnowledgeBase';
import FollowUps from './pages/FollowUps';
import Counselor from './pages/Counselor';
import Calls from './pages/Calls';
import CallDetail from './pages/CallDetail';
import Courses from './pages/Courses';
import Workshops from './pages/Workshops';
import Analytics from './pages/Analytics';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="dialer" element={<Dialer />} />
          <Route path="live-calls" element={<LiveCalls />} />
          <Route path="call-queue" element={<CallQueue />} />
          <Route path="leads" element={<Leads />} />
          <Route path="leads/:id" element={<LeadDetail />} />
          <Route path="contacts" element={<Contacts />} />
          <Route path="campaigns" element={<Campaigns />} />
          <Route path="agents" element={<Agents />} />
          <Route path="conversations" element={<Conversations />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="follow-ups" element={<FollowUps />} />
          <Route path="counselor" element={<Counselor />} />
          <Route path="calls" element={<Calls />} />
          <Route path="calls/:id" element={<CallDetail />} />
          <Route path="courses" element={<Courses />} />
          <Route path="workshops" element={<Workshops />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
