import React from 'react';
import './Settings.css';

export default function Settings({ auth }) {
  const fullName = auth?.fullName || auth?.username || 'User';
  const username = auth?.username || 'user';
  const email = auth?.email || `${username}@scaalable.com`;
  const phone = auth?.phone || 'Not configured';
  const role = auth?.role || 'USER';
  const initial = (fullName[0] || 'U').toUpperCase();

  const getRoleBadgeClass = (r) => {
    const roleLower = String(r || '').toLowerCase();
    return `badge badge-${roleLower}`;
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="page-eyebrow">Account &amp; System Settings</div>
        <h1>Settings</h1>
        <p>Manage your account profile, role preferences, and workspace configuration.</p>
      </div>

      <div className="settings-grid">
        {/* Profile Overview Card */}
        <div className="settings-card">
          <div className="profile-hero">
            <div className="profile-avatar-xl">{initial}</div>
            <div className="profile-hero-info">
              <h3>{fullName}</h3>
              <div className="profile-hero-handle">@{username}</div>
              <div className="profile-hero-tags">
                <span className={getRoleBadgeClass(role)}>{role}</span>
                <span className="badge badge-active">
                  <span className="status-dot"></span> ACTIVE ACCOUNT
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2>Profile &amp; Personal Information</h2>
              <p>Your current user identity registered in the CRM workspace.</p>
            </div>
          </div>

          <div className="settings-fields-grid">
            <div className="settings-field">
              <label>Full Name</label>
              <div className="readonly-input-wrapper">
                <input type="text" value={fullName} readOnly />
                <span className="readonly-badge">Read-only</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Username</label>
              <div className="readonly-input-wrapper">
                <input type="text" value={username} readOnly />
                <span className="readonly-badge">Read-only</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Email Address</label>
              <div className="readonly-input-wrapper">
                <input type="email" value={email} readOnly />
                <span className="readonly-badge">Read-only</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Phone Number (Web Dialer Callback)</label>
              <div className="readonly-input-wrapper">
                <input type="text" value={phone} readOnly />
                <span className="readonly-badge">Read-only</span>
              </div>
            </div>
          </div>
        </div>

        {/* Account System & Role Info */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-card-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <div>
              <h2>Account Permissions &amp; Security</h2>
              <p>System access level, JWT token session status, and workspace security controls.</p>
            </div>
          </div>

          <div className="settings-fields-grid" style={{ marginBottom: '1.25rem' }}>
            <div className="settings-field">
              <label>System Role</label>
              <div className="readonly-input-wrapper">
                <input type="text" value={role} readOnly />
                <span className="readonly-badge">Role</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Account Status</label>
              <div className="readonly-input-wrapper">
                <input type="text" value="ACTIVE" readOnly />
                <span className="readonly-badge">Status</span>
              </div>
            </div>

            <div className="settings-field">
              <label>Authentication Mode</label>
              <div className="readonly-input-wrapper">
                <input type="text" value="Spring Security JWT Session" readOnly />
                <span className="readonly-badge">Secured</span>
              </div>
            </div>
          </div>

          <div className="settings-info-notice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div>
              <strong>Account Administrator Notice</strong>
              <div>
                Profile updates and password changes are managed by your SCAALABLE System Administrator. Contact your workspace manager to update your account credentials or phone number.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
