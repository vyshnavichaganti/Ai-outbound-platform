import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  PhoneCall,
  Radio,
  ListOrdered,
  History,
  Users,
  Contact2,
  Layers,
  Bot,
  MessageSquare,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  PieChart,
  BarChart3,
  Settings,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Sidebar({ collapsed, onToggle }) {
  const sections = [
    {
      title: 'COMMAND CENTER',
      items: [
        { label: 'Command Center', path: '/', icon: LayoutDashboard }
      ]
    },
    {
      title: 'CALL OPERATIONS',
      items: [
        { label: 'AI Dialer', path: '/dialer', icon: PhoneCall, highlight: 'HERO' },
        { label: 'Live Calls', path: '/live-calls', icon: Radio },
        { label: 'Call Queue', path: '/call-queue', icon: ListOrdered },
        { label: 'Call History', path: '/calls', icon: History }
      ]
    },
    {
      title: 'CRM',
      items: [
        { label: 'Leads', path: '/leads', icon: Users },
        { label: 'Contacts', path: '/contacts', icon: Contact2 },
        { label: 'Campaigns', path: '/campaigns', icon: Layers }
      ]
    },
    {
      title: 'AI',
      items: [
        { label: 'AI Agents', path: '/agents', icon: Bot },
        { label: 'Conversations', path: '/conversations', icon: MessageSquare },
        { label: 'Knowledge Base', path: '/knowledge-base', icon: BookOpen }
      ]
    },
    {
      title: 'ENGAGEMENT',
      items: [
        { label: 'Follow-ups', path: '/follow-ups', icon: CalendarCheck },
        { label: 'Workshops', path: '/workshops', icon: GraduationCap }
      ]
    },
    {
      title: 'ANALYTICS',
      items: [
        { label: 'Analytics', path: '/analytics', icon: PieChart },
        { label: 'Reports', path: '/reports', icon: BarChart3 }
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { label: 'Settings', path: '/settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : 'expanded'}`}>
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="logo-icon">
            <Sparkles size={18} />
          </div>
          {!collapsed && (
            <div className="logo-text">
              <h2>AI OUTBOUND</h2>
              <p>Call Center Platform</p>
            </div>
          )}
        </div>
        <button
          onClick={onToggle}
          style={{ color: 'var(--text-on-dark-muted)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px' }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Sidebar Nav Sections */}
      <nav className="sidebar-nav">
        {sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: '10px' }}>
            {!collapsed && <div className="sidebar-section-label">{section.title}</div>}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                  end={item.path === '/'}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon size={18} className="nav-icon" />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.highlight && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'var(--gold-primary)',
                      color: '#111',
                      fontSize: '9.5px',
                      fontWeight: '700',
                      padding: '2px 5px',
                      borderRadius: '4px'
                    }}>
                      {item.highlight}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-profile">
          <div className="avatar">V</div>
          {!collapsed && (
            <div className="user-info">
              <h4>Vyshnavi</h4>
              <p>Call Center Admin</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
