import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StatCard({ label, value, change, isPositive = true, comparisonText = 'vs last month', icon: Icon }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span className="stat-label">{label}</span>
        {Icon && (
          <div className="stat-icon">
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-value">{value}</div>

      <div className="stat-footer">
        {change && (
          <span className={`stat-change ${isPositive ? 'positive' : 'negative'}`}>
            {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            {change}
          </span>
        )}
        <span className="stat-comparison">{comparisonText}</span>
      </div>
    </div>
  );
}
