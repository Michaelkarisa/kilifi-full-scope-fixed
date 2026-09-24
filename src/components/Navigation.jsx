import { useState } from 'react';

export default function Navigation({
  activeSection,
  onSectionChange,
  onLoginClick,
  isAuthenticated,
  user,
  onLogout,
}) {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'news', label: 'News' },
    { id: 'events', label: 'Events' },
    { id: 'jobs', label: 'Jobs' },
    { id: 'tenders', label: 'Tenders' },
    { id: 'departments', label: 'Departments' },
    { id: 'services', label: 'Services' },
    { id: 'projects', label: 'Projects' },
    { id: 'leadership', label: 'Leadership' },
    { id: 'announcements', label: 'Announcements' },
    { id: 'blog', label: 'Blog' },
    { id: 'sectors', label: 'Sectors' },
    { id: 'partnerships', label: 'Partnerships' },
    { id: 'documents', label: 'Documents' },
    { id: 'faqs', label: 'FAQs' },
    { id: 'tourism', label: 'Tourism' },
    { id: 'about', label: 'About County' },
  ];

  const getUserInitial = () => {
    return user?.name?.charAt(0).toUpperCase() || 'U';
  };

  return (
    <nav className="nav">
      <div className="nav-inner">
        <a className="nav-logo" href="#" onClick={() => onSectionChange('home')}>
          <div className="nav-emblem">🌊</div>
          Kilifi County
        </a>
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeSection === tab.id ? 'active' : ''}`}
              onClick={() => onSectionChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
          {isAuthenticated && (
            <button
              className={`nav-tab ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => onSectionChange('dashboard')}
            >
              My Portal
            </button>
          )}
        </div>
        <div className="nav-auth">
          {isAuthenticated ? (
            <>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginLeft: 'auto',
                }}
              >
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,.8)' }}>
                  {user?.name}
                </span>
                <button
                  className="btn-login authed"
                  onClick={onLogout}
                  style={{ fontSize: '12px' }}
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <button className="btn-login" onClick={onLoginClick}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
