import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="app-header">
      <div className="header-brand">
        <div className="brand-logo">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
            <line x1="6" y1="6" x2="6.01" y2="6"></line>
            <line x1="6" y1="18" x2="6.01" y2="18"></line>
          </svg>
        </div>
        <div>
          <h1 className="brand-title">Enterprise Infrastructure Storage Console</h1>
          <span className="brand-tag">High-Availability Storage Management System · Demo</span>
        </div>
      </div>

      <div className="header-meta">
        <span className="cluster-status-pill">
          <span className="status-dot"></span>
          HA Cluster Online
        </span>
        <span className="user-profile-badge">
          Vladislav Okin · Tech Lead
        </span>
      </div>
    </header>
  );
};
