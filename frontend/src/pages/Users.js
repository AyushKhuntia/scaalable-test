import React, { useEffect, useMemo, useState } from 'react';
import api from '../api';
import './Users.css';

const emptyUser = {
  fullName: '',
  username: '',
  email: '',
  password: '',
  phone: '',
  role: 'AGENT',
};

const ROLE_LABELS = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  AGENT: 'Agent',
};

export default function Users({ auth }) {
  const isAdmin = auth?.role === 'ADMIN';
  const canManageUsers = isAdmin || auth?.role === 'MANAGER';

  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [forbidden, setForbidden] = useState(false);

  const load = async () => {
    setLoading(true);
    setErr('');
    setForbidden(false);

    try {
      const { data } = await api.get('/api/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      if (error.response?.status === 403 || !isAdmin) {
        setForbidden(true);
      } else {
        setErr(error.response?.data?.error || 'Unable to load user list.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch =
        !query ||
        user.fullName?.toLowerCase().includes(query) ||
        user.username?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query);

      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.status === 'ACTIVE').length,
      agents: users.filter((u) => u.role === 'AGENT').length,
      managers: users.filter((u) => u.role === 'MANAGER').length,
    };
  }, [users]);

  const openAddModal = () => {
    if (!canManageUsers) return;
    setForm(emptyUser);
    setErr('');
    setMsg('');
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    if (saving) return;
    setShowAddModal(false);
    setForm(emptyUser);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const create = async (e) => {
    e.preventDefault();
    if (!canManageUsers) return;

    setSaving(true);
    setErr('');
    setMsg('');

    try {
      const { data } = await api.post('/api/users', form);
      setMsg(`User @${data.username} created successfully.`);
      setForm(emptyUser);
      setShowAddModal(false);
      await load();
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.error || 'Could not create user');
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (user) => {
    if (!canManageUsers) return;
    setErr('');
    setMsg('');
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';

    try {
      await api.patch(`/api/users/${user.userId}/status`, {
        status: nextStatus,
      });
      setMsg(`User @${user.username} is now ${nextStatus.toLowerCase()}`);
      await load();
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.error || 'Could not update status');
    }
  };

  const removeUser = async (user) => {
    if (!canManageUsers) return;
    const confirmed = window.confirm(
      `Are you sure you want to remove user @${user.username}?`
    );
    if (!confirmed) return;

    setErr('');
    setMsg('');

    try {
      await api.delete(`/api/users/${user.userId}`);
      setMsg(`User @${user.username} removed successfully`);
      await load();
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.error || 'Could not remove user');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  const getInitials = (fullName, username) => {
    const name = fullName?.trim();
    if (name) {
      const parts = name.split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return (username?.[0] || 'U').toUpperCase();
  };

  const formatRole = (role) => ROLE_LABELS[role] || role || 'User';

  return (
    <div className="users-page">
      {/* Header */}
      <div className="users-header">
        <div>
          <div className="page-eyebrow">Administration</div>
          <h1>Users</h1>
          <p>Team directory and user account permissions.</p>
        </div>

        {canManageUsers && (
          <button className="users-primary-btn" onClick={openAddModal}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span>Add User</span>
          </button>
        )}
      </div>

      {/* Messages */}
      {msg && (
        <div className="users-alert users-alert-success">
          <span>✓ {msg}</span>
          <button onClick={() => setMsg('')}>×</button>
        </div>
      )}

      {err && (
        <div className="users-alert users-alert-error">
          <span>! {err}</span>
          <button onClick={() => setErr('')}>×</button>
        </div>
      )}

      {/* If Backend Security explicitly restricts GET /api/users to ADMIN role */}
      {forbidden ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="users-alert" style={{ background: 'var(--primary-light)', border: '1px solid var(--primary-border)', color: '#1e40af', padding: '1.25rem', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', gap: '0.875rem' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <div>
                <strong style={{ fontSize: '1rem', display: 'block', marginBottom: '0.25rem' }}>
                  Backend Access Restriction Notice
                </strong>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, margin: 0 }}>
                  The backend security configuration (<code>SecurityConfig.java</code>) restricts the <code>/api/users</code> endpoint strictly to accounts with the <code>ADMIN</code> role.
                </p>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.5, marginTop: '0.5rem', margin: 0 }}>
                  As an <strong>Agent</strong>, you can view your personal profile, phone configuration, and account role under <strong>Settings</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Agent's Own Profile Card View */}
          <div className="users-table-card" style={{ padding: '1.75rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Your Team Profile
            </h3>
            <div className="user-identity" style={{ gap: '1rem' }}>
              <div className="user-avatar" style={{ width: '48px', height: '48px', fontSize: '1.125rem' }}>
                {getInitials(auth?.fullName, auth?.username)}
              </div>
              <div>
                <strong style={{ fontSize: '1.125rem' }}>{auth?.fullName || auth?.username || 'Agent User'}</strong>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>@{auth?.username || 'agent'}</div>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                  <span className="badge badge-agent">{auth?.role || 'AGENT'}</span>
                  <span className="badge badge-active">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="users-stats-grid">
            <div className="users-stat-card">
              <div className="users-stat-icon users-stat-icon-total">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <span>Total Users</span>
                <strong>{stats.total}</strong>
              </div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-icon users-stat-icon-active">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <span>Active Users</span>
                <strong>{stats.active}</strong>
              </div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-icon users-stat-icon-agent">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <span>Agents</span>
                <strong>{stats.agents}</strong>
              </div>
            </div>

            <div className="users-stat-card">
              <div className="users-stat-icon users-stat-icon-manager">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div>
                <span>Managers</span>
                <strong>{stats.managers}</strong>
              </div>
            </div>
          </div>

          {/* Toolbar */}
          <div className="users-toolbar">
            <div className="users-search-box">
              <svg className="users-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search by name, username, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="users-clear-search" onClick={() => setSearchQuery('')}>×</button>
              )}
            </div>

            <select
              className="users-filter-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admin</option>
              <option value="MANAGER">Manager</option>
              <option value="AGENT">Agent</option>
            </select>

            <select
              className="users-filter-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            {(searchQuery || roleFilter !== 'ALL' || statusFilter !== 'ALL') && (
              <button className="users-clear-filters" onClick={clearFilters}>
                Clear filters
              </button>
            )}
          </div>

          {/* Summary */}
          <div className="users-list-summary">
            <span>
              Showing <strong>{filteredUsers.length}</strong> of <strong>{users.length}</strong> users
            </span>
          </div>

          {/* Users Table */}
          <div className="users-table-card">
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th className="users-action-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="users-table-loading">
                        Loading users...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="users-empty">
                        No users matching criteria found.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.userId}>
                        <td>
                          <div className="user-identity">
                            <div className="user-avatar">
                              {getInitials(user.fullName, user.username)}
                            </div>
                            <div className="user-identity-info">
                              <strong>{user.fullName || 'Unnamed User'}</strong>
                              <span>@{user.username}</span>
                            </div>
                          </div>
                        </td>
                        <td><span className="user-email">{user.email || '—'}</span></td>
                        <td><span className="user-phone">{user.phone || '—'}</span></td>
                        <td>
                          <span className={`user-role-badge user-role-${String(user.role || '').toLowerCase()}`}>
                            {formatRole(user.role)}
                          </span>
                        </td>
                        <td>
                          <span className={`user-status-badge ${user.status === 'ACTIVE' ? 'user-status-active' : 'user-status-inactive'}`}>
                            <span className="user-status-dot"></span>
                            {user.status || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="users-action-column">
                          {canManageUsers ? (
                            <div className="user-actions">
                              <button
                                className={`user-action-btn ${user.status === 'ACTIVE' ? 'user-action-deactivate' : 'user-action-activate'}`}
                                onClick={() => toggleStatus(user)}
                              >
                                {user.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                className="user-action-btn user-action-remove"
                                onClick={() => removeUser(user)}
                              >
                                Remove
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Read Only</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && canManageUsers && (
        <div className="users-modal-overlay" onClick={closeAddModal}>
          <div className="users-modal" onClick={(e) => e.stopPropagation()}>
            <div className="users-modal-header">
              <div>
                <h2>Add New User</h2>
                <p>Create a user account and set system permissions.</p>
              </div>
              <button className="users-modal-close" onClick={closeAddModal}>×</button>
            </div>

            <form onSubmit={create}>
              <div className="users-form-grid">
                <div className="users-form-field">
                  <label>Full Name *</label>
                  <input
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleFormChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className="users-form-field">
                  <label>Username *</label>
                  <input
                    name="username"
                    required
                    minLength={3}
                    value={form.username}
                    onChange={handleFormChange}
                    placeholder="john.doe"
                  />
                </div>

                <div className="users-form-field">
                  <label>Email *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={handleFormChange}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="users-form-field">
                  <label>Password *</label>
                  <input
                    name="password"
                    type="password"
                    required
                    minLength={4}
                    value={form.password}
                    onChange={handleFormChange}
                    placeholder="••••••••"
                  />
                </div>

                <div className="users-form-field">
                  <label>Phone Number</label>
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleFormChange}
                    placeholder="+919876543210"
                  />
                  <small>Agent's callback / outbound number.</small>
                </div>

                <div className="users-form-field">
                  <label>System Role *</label>
                  <select name="role" value={form.role} onChange={handleFormChange}>
                    <option value="AGENT">AGENT — Work leads, make calls</option>
                    <option value="MANAGER">MANAGER — Manage &amp; assign leads</option>
                    <option value="ADMIN">ADMIN — Full system access</option>
                  </select>
                </div>
              </div>

              <div className="users-role-info">
                <strong>Role permissions summary:</strong>
                <span>• Agent: Access to assigned leads &amp; web dialer</span>
                <span>• Manager: Access to lead pool &amp; assignment rules</span>
                <span>• Admin: Full CRM administration &amp; user management</span>
              </div>

              <div className="users-modal-footer">
                <button type="button" className="users-modal-secondary" onClick={closeAddModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="users-modal-primary" disabled={saving}>
                  {saving ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}