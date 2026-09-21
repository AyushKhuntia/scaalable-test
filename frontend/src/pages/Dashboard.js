import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './Dashboard.css';

/* =========================================================
   COMMON HELPERS
========================================================= */

const getLeadName = (lead) => {
  if (!lead) return 'Unknown Lead';
  const name = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
  return name || `Lead #${lead.leadId}`;
};

const formatDuration = (seconds) => {
  if (!seconds || seconds < 1) return '0m';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;
  return `${hours}h ${remainingMins}m`;
};

const formatTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const formatStatus = (status) => {
  return String(status || 'NEW').replace(/_/g, ' ');
};

const getStatusBadgeClass = (status) => {
  const s = String(status || 'NEW').toLowerCase().replace(/_/g, '-');
  return `badge badge-${s}`;
};

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

function AdminDashboard() {
  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadAdminDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [leadsResponse, agentsResponse] = await Promise.all([
          api.get('/api/leads?page=0&size=100'),
          api.get('/api/users/role/AGENT'),
        ]);

        const leadsData = leadsResponse.data;
        setLeads(leadsData?.content || (Array.isArray(leadsData) ? leadsData : []));
        setTotalElements(
          leadsData?.totalElements || (Array.isArray(leadsData) ? leadsData.length : 0)
        );
        setAgents(Array.isArray(agentsResponse.data) ? agentsResponse.data : []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Unable to load admin dashboard.');
      } finally {
        setLoading(false);
      }
    };

    loadAdminDashboard();
  }, []);

  const statusCounts = useMemo(() => {
    return {
      NEW: leads.filter((l) => l.status === 'NEW').length,
      ASSIGNED: leads.filter((l) => l.status === 'ASSIGNED').length,
      CONTACTED: leads.filter((l) => l.status === 'CONTACTED').length,
      FOLLOW_UP: leads.filter((l) => l.status === 'FOLLOW_UP').length,
      NOT_INTERESTED: leads.filter((l) => l.status === 'NOT_INTERESTED').length,
      CONVERTED: leads.filter((l) => l.status === 'CONVERTED').length,
      CLOSED: leads.filter((l) => l.status === 'CLOSED').length,
    };
  }, [leads]);

  const recentLeads = useMemo(() => leads.slice(0, 6), [leads]);

  return (
    <div className="dashboard-wrapper">
      {/* HEADER */}
      <div className="dashboard-heading">
        <div>
          <div className="dashboard-eyebrow">Admin Workspace</div>
          <h2>Dashboard</h2>
          <p>Real-time overview of CRM leads, assignment distribution, and sales team.</p>
        </div>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">Loading dashboard...</div>
      ) : (
        <>
          {/* KPI CARDS */}
          <div className="dashboard-kpi-grid">
            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div>
                <span>Total Leads</span>
                <strong>{totalElements}</strong>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <div>
                <span>New Leads</span>
                <strong>{statusCounts.NEW}</strong>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div>
                <span>Assigned Leads</span>
                <strong>{statusCounts.ASSIGNED}</strong>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              </div>
              <div>
                <span>Follow Ups</span>
                <strong>{statusCounts.FOLLOW_UP}</strong>
              </div>
            </div>

            <div className="dashboard-kpi-card">
              <div className="dashboard-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div>
                <span>Converted</span>
                <strong>{statusCounts.CONVERTED}</strong>
              </div>
            </div>
          </div>

          {/* MAIN GRID */}
          <div className="dashboard-grid">
            {/* STATUS OVERVIEW */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h3>Lead Status Overview</h3>
                  <p>Distribution across lead workflow stages.</p>
                </div>
                <Link to="/leads">View Leads →</Link>
              </div>

              <div className="dashboard-status-list">
                <div className="dashboard-status-row">
                  <span>New</span>
                  <strong>{statusCounts.NEW}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Assigned</span>
                  <strong>{statusCounts.ASSIGNED}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Contacted</span>
                  <strong>{statusCounts.CONTACTED}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Follow Up</span>
                  <strong>{statusCounts.FOLLOW_UP}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Not Interested</span>
                  <strong>{statusCounts.NOT_INTERESTED}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Converted</span>
                  <strong>{statusCounts.CONVERTED}</strong>
                </div>
                <div className="dashboard-status-row">
                  <span>Closed</span>
                  <strong>{statusCounts.CLOSED}</strong>
                </div>
              </div>
            </section>

            {/* SALES TEAM ROSTER */}
            <section className="dashboard-card">
              <div className="dashboard-card-header">
                <div>
                  <h3>Sales Team</h3>
                  <p>Agents currently active in CRM.</p>
                </div>
                <Link to="/users">Manage Users →</Link>
              </div>

              {agents.length === 0 ? (
                <div className="dashboard-empty">No agents registered yet.</div>
              ) : (
                <div className="dashboard-agent-list">
                  {agents.slice(0, 6).map((agent) => (
                    <div key={agent.userId} className="dashboard-agent-item">
                      <div className="dashboard-agent-avatar">
                        {(agent.fullName?.[0] || agent.username?.[0] || 'A').toUpperCase()}
                      </div>
                      <div className="dashboard-agent-info">
                        <strong>{agent.fullName || agent.username || 'Agent'}</strong>
                        <span>@{agent.username || 'agent'}</span>
                      </div>
                      <span className="dashboard-agent-role">AGENT</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* RECENT LEADS TABLE */}
          <section className="dashboard-card dashboard-recent-card">
            <div className="dashboard-card-header">
              <div>
                <h3>Recent Leads</h3>
                <p>Latest lead entries in system.</p>
              </div>
              <Link to="/leads">View All Leads →</Link>
            </div>

            {recentLeads.length === 0 ? (
              <div className="dashboard-empty">No leads found.</div>
            ) : (
              <div className="dashboard-table-wrapper">
                <table className="dashboard-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Company</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Assigned Agent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.leadId}>
                        <td>
                          <Link to={`/leads/${lead.leadId}`} className="dashboard-lead-link">
                            {getLeadName(lead)}
                          </Link>
                        </td>
                        <td>{lead.company || '—'}</td>
                        <td>{lead.phone || '—'}</td>
                        <td>
                          <span className={getStatusBadgeClass(lead.status)}>
                            {formatStatus(lead.status)}
                          </span>
                        </td>
                        <td>{lead.assignedAgentName || 'Unassigned'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

/* =========================================================
   AGENT DASHBOARD
========================================================= */

function AgentDashboard({ auth }) {
  const [calls, setCalls] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        const [callsResponse, leadsResponse] = await Promise.all([
          api.get('/api/calls/my'),
          api.get('/api/assignments/my'),
        ]);

        setCalls(Array.isArray(callsResponse.data) ? callsResponse.data : []);
        setMyLeads(Array.isArray(leadsResponse.data) ? leadsResponse.data : []);
      } catch (err) {
        console.error(err);
        setError(err.response?.data?.error || 'Unable to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const todayCalls = useMemo(() => {
    const today = new Date();
    return calls.filter((call) => {
      if (!call.startTime) return false;
      const callDate = new Date(call.startTime);
      return (
        callDate.getFullYear() === today.getFullYear() &&
        callDate.getMonth() === today.getMonth() &&
        callDate.getDate() === today.getDate()
      );
    });
  }, [calls]);

  const connectedCalls = useMemo(() => {
    return todayCalls.filter((call) => {
      const status = String(call.callStatus || '').toLowerCase();
      return status === 'completed' || status === 'connected' || status === 'answered';
    });
  }, [todayCalls]);

  const convertedCalls = useMemo(() => {
    return calls.filter(
      (call) => call.disposition?.name === 'CONVERTED' || call.lead?.status === 'CONVERTED'
    );
  }, [calls]);

  const totalDuration = useMemo(() => {
    return todayCalls.reduce((total, call) => total + (call.durationSeconds || 0), 0);
  }, [todayCalls]);

  const followUpLeads = useMemo(() => {
    return myLeads.filter((assignment) => assignment.lead?.status === 'FOLLOW_UP');
  }, [myLeads]);

  const recentCalls = useMemo(() => {
    return [...calls]
      .sort((a, b) => new Date(b.startTime || 0) - new Date(a.startTime || 0))
      .slice(0, 8);
  }, [calls]);

  return (
    <div className="agent-dashboard">
      {/* HEADER */}
      <div className="agent-dashboard-header">
        <div>
          <div className="agent-dashboard-eyebrow">Agent Workstation</div>
          <h2>Hello, {auth?.fullName || auth?.username || 'Agent'} 👋</h2>
          <p>Track your personal lead assignments and daily outbound calling queue.</p>
        </div>
        <Link to="/dialer" className="agent-start-call-btn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <span>Start Calling</span>
        </Link>
      </div>

      {error && <div className="dashboard-error">{error}</div>}

      {loading ? (
        <div className="dashboard-loading">Loading your dashboard...</div>
      ) : (
        <>
          {/* KPI GRID */}
          <div className="agent-kpi-grid">
            <div className="agent-kpi-card">
              <div className="agent-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                </svg>
              </div>
              <div>
                <span>My Leads</span>
                <strong>{myLeads.length}</strong>
              </div>
            </div>

            <div className="agent-kpi-card">
              <div className="agent-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <span>Calls Today</span>
                <strong>{todayCalls.length}</strong>
              </div>
            </div>

            <div className="agent-kpi-card">
              <div className="agent-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <div>
                <span>Connected</span>
                <strong>{connectedCalls.length}</strong>
              </div>
            </div>

            <div className="agent-kpi-card">
              <div className="agent-kpi-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div>
                <span>Converted</span>
                <strong>{convertedCalls.length}</strong>
              </div>
            </div>
          </div>

          {/* CALLING + FOLLOW UPS */}
          <div className="agent-dashboard-grid">
            <section className="agent-card">
              <div className="agent-card-header">
                <div>
                  <h3>Today's Activity</h3>
                  <p>Summary of calls placed today.</p>
                </div>
                <Link to="/dialer">Open Dialer →</Link>
              </div>

              <div className="calling-summary">
                <div>
                  <span>Total Calls</span>
                  <strong>{todayCalls.length}</strong>
                </div>
                <div>
                  <span>Connected</span>
                  <strong>{connectedCalls.length}</strong>
                </div>
                <div>
                  <span>Talk Time</span>
                  <strong>{formatDuration(totalDuration)}</strong>
                </div>
              </div>
            </section>

            <section className="agent-card">
              <div className="agent-card-header">
                <div>
                  <h3>Follow-up Leads</h3>
                  <p>Leads flagged for follow-up call.</p>
                </div>
                <Link to="/myleads">View All →</Link>
              </div>

              {followUpLeads.length === 0 ? (
                <div className="agent-empty">No follow-up leads currently scheduled.</div>
              ) : (
                <div className="followup-list">
                  {followUpLeads.slice(0, 5).map((assignment) => {
                    const lead = assignment.lead;
                    return (
                      <Link
                        key={assignment.assignmentId}
                        to={`/leads/${lead?.leadId}`}
                        className="followup-item"
                      >
                        <div>
                          <strong>{getLeadName(lead)}</strong>
                          <span>{lead?.company || lead?.phone || '—'}</span>
                        </div>
                        <span className="badge badge-follow-up">FOLLOW UP</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          {/* RECENT CALLS */}
          <section className="agent-card recent-calls-card">
            <div className="agent-card-header">
              <div>
                <h3>Recent Calls</h3>
                <p>Your latest call history.</p>
              </div>
              <Link to="/dialer">Open Dialer →</Link>
            </div>

            {recentCalls.length === 0 ? (
              <div className="agent-empty">No calls logged yet.</div>
            ) : (
              <div className="agent-table-wrapper">
                <table className="agent-table">
                  <thead>
                    <tr>
                      <th>Lead</th>
                      <th>Number</th>
                      <th>Status</th>
                      <th>Disposition</th>
                      <th>Duration</th>
                      <th>Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentCalls.map((call) => (
                      <tr key={call.callId}>
                        <td>
                          <Link to={`/leads/${call.lead?.leadId}`} className="agent-lead-link">
                            {getLeadName(call.lead)}
                          </Link>
                        </td>
                        <td>{call.toNumber || call.lead?.phone || '—'}</td>
                        <td>
                          <span className="badge badge-assigned">{call.callStatus || 'Logged'}</span>
                        </td>
                        <td>{call.disposition?.name || '—'}</td>
                        <td>{formatDuration(call.durationSeconds)}</td>
                        <td>{formatTime(call.startTime)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function Dashboard({ auth }) {
  if (auth?.role === 'ADMIN') {
    return <AdminDashboard />;
  }
  return <AgentDashboard auth={auth} />;
}