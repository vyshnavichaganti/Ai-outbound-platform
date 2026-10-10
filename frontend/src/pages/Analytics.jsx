import React, { useState, useEffect } from 'react';
import apiClient from '../services/api';
import ChartCard from '../components/ChartCard';
import StatCard from '../components/StatCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import {
  Users, PhoneCall, CheckCircle, Award, Clock,
  TrendingUp, Calendar, Layers, PieChart as PieIcon
} from 'lucide-react';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await apiClient.get('/analytics');
        setAnalytics(res);
      } catch (err) {
        console.error(err);
        setAnalytics(null);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) return <LoadingSkeleton rows={5} />;
  if (!analytics || (analytics.metrics.total_leads === 0 && analytics.metrics.total_calls === 0)) {
    return (
      <EmptyState
        title="NO ANALYTICS DATA YET"
        message="Import student candidate leads or initiate AI calls to generate real-time performance analytics."
        action={
          <a href="/leads" className="btn btn-gold">Import Candidate Leads</a>
        }
      />
    );
  }

  const { metrics, outcomes, lead_statuses, calls_over_time, campaign_performance } = analytics;

  const outcomePieData = [
    { name: 'Completed', value: outcomes.completed || 0, fill: '#28A745' },
    { name: 'In Progress / Ringing', value: outcomes.in_progress || 0, fill: '#2B6CB0' },
    { name: 'Busy', value: outcomes.busy || 0, fill: '#ED8936' },
    { name: 'No Answer / Unreachable', value: outcomes.no_answer || 0, fill: '#D69E2E' },
    { name: 'Failed / Error', value: outcomes.failed || 0, fill: '#E53E3E' }
  ].filter(d => d.value > 0);

  const statusBarData = Object.keys(lead_statuses || {}).map(key => ({
    status: key,
    count: lead_statuses[key]
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '700' }}>AI Outbound Call Center Analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '13.5px' }}>
          Real-time metrics, call completion rates, conversion performance, and lead distribution.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '18px' }}>
        <StatCard label="Total Candidate Leads" value={metrics.total_leads} comparisonText="Database records" icon={Users} />
        <StatCard label="Total Calls Attempted" value={metrics.total_calls} comparisonText="PSTN / Web turns" icon={PhoneCall} />
        <StatCard label="Completed Calls" value={metrics.completed_calls} comparisonText="Finished conversations" icon={CheckCircle} />
        <StatCard label="Interested / Qualified" value={metrics.interested_leads} comparisonText="High & Medium intent" icon={Award} />
        <StatCard label="Conversion Rate" value={`${metrics.conversion_rate}%`} comparisonText="Leads interested" icon={TrendingUp} />
        <StatCard label="Avg Call Duration" value={metrics.avg_duration} comparisonText="Real conversation duration" icon={Clock} />
      </div>

      {/* Charts Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Call Outcomes Pie Chart */}
        <ChartCard title="Outbound Call Outcomes" subtitle="Distribution recorded in database">
          {outcomePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={outcomePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                  {outcomePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ padding: '20px', color: 'var(--text-muted)', fontStyle: 'italic', textAlign: 'center' }}>No call outcomes recorded yet.</p>
          )}
        </ChartCard>

        {/* Lead Status Distribution Bar Chart */}
        <ChartCard title="Lead Status Distribution" subtitle="Candidate breakdown by pipeline stage">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--gold-dark)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
