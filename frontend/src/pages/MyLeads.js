import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import './MyLeads.css';

const STATUS_OPTIONS = ['ALL', 'NEW', 'ASSIGNED', 'CONTACTED', 'FOLLOW_UP', 'NOT_INTERESTED', 'CONVERTED', 'CLOSED'];

const formatStatus = (status) => String(status || 'NEW').replace(/_/g, ' ');

const getStatusBadgeClass = (status) => {
  const s = String(status || 'NEW').toLowerCase().replace(/_/g, '-');
  return `badge badge-${s}`;
};

export default function MyLeads({ auth }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    setLoading(true);
    api.get('/api/assignments/my')
      .then((r) => {
        setAssignments(Array.isArray(r.data) ? r.data : []);
      })
      .catch((error) => {
        console.error(error);
        setErr('Could not load your assigned leads');
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredAssignments = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return assignments.filter((a) => {
      const lead = a.lead || {};
      const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
      const phone = (lead.phone || '').toLowerCase();
      const company = (lead.company || '').toLowerCase();

      const matchesSearch =
        !query ||
        leadName.includes(query) ||
        phone.includes(query) ||
        company.includes(query);

      const matchesStatus = filterStatus === 'ALL' || lead.status === filterStatus;

      return matchesSearch && matchesStatus;
    });
  }, [assignments, searchQuery, filterStatus]);

  const kpiStats = useMemo(() => {
    return {
      total: assignments.length,
      new: assignments.filter((a) => a.lead?.status === 'NEW').length,
      followUp: assignments.filter((a) => a.lead?.status === 'FOLLOW_UP').length,
      converted: assignments.filter((a) => a.lead?.status === 'CONVERTED').length,
    };
  }, [assignments]);

  const startCall = (lead) => {
    if (!lead) return;
    sessionStorage.setItem('dialLead', JSON.stringify(lead));
    navigate('/dialer');
  };

  return (
    <div className="myleads-page">
      {/* Header */}
      <div className="myleads-header">
        <div>
          <div className="page-eyebrow">Agent Workstation</div>
          <h1>My Leads</h1>
          <p>Your personal outbound calling queue and assigned lead pipeline.</p>
        </div>
      </div>

      {err && <div className="myleads-error">{err}</div>}

      {/* KPI Stats */}
      <div className="myleads-kpi-grid">
        <div className="myleads-kpi-card">
          <div className="myleads-kpi-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
            </svg>
          </div>
          <div>
            <span>Assigned Queue</span>
            <strong>{kpiStats.total}</strong>
          </div>
        </div>

        <div className="myleads-kpi-card">
          <div className="myleads-kpi-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </div>
          <div>
            <span>New Uncontacted</span>
            <strong>{kpiStats.new}</strong>
          </div>
        </div>

        <div className="myleads-kpi-card">
          <div className="myleads-kpi-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div>
            <span>Follow Ups</span>
            <strong>{kpiStats.followUp}</strong>
          </div>
        </div>

        <div className="myleads-kpi-card">
          <div className="myleads-kpi-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div>
            <span>Converted</span>
            <strong>{kpiStats.converted}</strong>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="myleads-toolbar">
        <div className="myleads-search-box">
          <svg className="myleads-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search by lead name, phone, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="myleads-filter-select"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status === 'ALL' ? 'All Lead Statuses' : formatStatus(status)}
            </option>
          ))}
        </select>
      </div>

      {/* Table Card */}
      <div className="myleads-table-card">
        <div className="myleads-table-wrapper">
          <table className="myleads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Phone</th>
                <th>Company</th>
                <th>Status</th>
                <th>Assigned By</th>
                <th>Assigned Date</th>
                <th className="myleads-actions-column">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="myleads-empty">
                    Loading your calling queue...
                  </td>
                </tr>
              ) : filteredAssignments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="myleads-empty">
                    No assigned leads found in your queue.
                  </td>
                </tr>
              ) : (
                filteredAssignments.map((a) => {
                  const lead = a.lead || {};
                  const leadName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unnamed Lead';
                  const initial = (lead.firstName?.[0] || 'L').toUpperCase();

                  return (
                    <tr key={a.assignmentId}>
                      <td>
                        <div className="myleads-identity">
                          <div className="myleads-avatar">{initial}</div>
                          <div>
                            <strong>{leadName}</strong>
                            <small>ID #{lead.leadId}</small>
                          </div>
                        </div>
                      </td>

                      <td>
                        <strong>{lead.phone || '—'}</strong>
                      </td>

                      <td>{lead.company || '—'}</td>

                      <td>
                        <span className={getStatusBadgeClass(lead.status)}>
                          {formatStatus(lead.status)}
                        </span>
                      </td>

                      <td>{a.assignedBy?.fullName || 'Manager'}</td>

                      <td>
                        {a.assignedAt ? a.assignedAt.replace('T', ' ').slice(0, 16) : '—'}
                      </td>

                      <td className="myleads-actions-column">
                        <div className="myleads-row-actions">
                          <Link to={`/leads/${lead.leadId}`} className="view-lead-btn">
                            View
                          </Link>
                          <button className="call-action-btn" onClick={() => startCall(lead)}>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                            </svg>
                            <span>Call</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
