import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import './LeadDetails.css';

const formatStatus = (status) => String(status || 'NEW').replace(/_/g, ' ');

const getStatusBadgeClass = (status) => {
  const s = String(status || 'NEW').toLowerCase().replace(/_/g, '-');
  return `badge badge-${s}`;
};

const formatDuration = (seconds) => {
  const totalSeconds = Number(seconds) || 0;
  if (totalSeconds <= 0) return '0 sec';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (secs || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
};

const formatCallDateTime = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleString([], {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
};

export default function LeadDetails({ auth }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [callHistory, setCallHistory] = useState([]);
  const [callHistoryLoading, setCallHistoryLoading] = useState(true);
  const [callHistoryError, setCallHistoryError] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCloseModal, setShowCloseModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setCallHistoryLoading(true);
      setCallHistoryError('');

      const [leadResult, callsResult, assignResult] = await Promise.allSettled([
        api.get(`/api/leads/${id}`),
        api.get(`/api/calls/lead/${id}`),
        api.get(`/api/assignments/lead/${id}`),
      ]);

      if (leadResult.status === 'fulfilled') {
        setLead(leadResult.value.data);
      } else {
        console.error('Failed to load lead details', leadResult.reason);
        alert('Failed to load lead details');
      }

      if (callsResult.status === 'fulfilled') {
        setCallHistory(Array.isArray(callsResult.value.data) ? callsResult.value.data : []);
      } else {
        console.error('Failed to load call history', callsResult.reason);
        setCallHistory([]);
        setCallHistoryError('Unable to load call history.');
      }

      if (assignResult.status === 'fulfilled') {
        setAssignments(Array.isArray(assignResult.value.data) ? assignResult.value.data : []);
      } else {
        console.error('Failed to load assignment history', assignResult.reason);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load lead details');
    } finally {
      setLoading(false);
      setCallHistoryLoading(false);
    }
  };

  const handleJustClose = async () => {
    try {
      await api.put(`/api/leads/${id}`, { status: 'CLOSED' });
      setShowCloseModal(false);
      fetchData();
    } catch (err) {
      alert('Failed to close lead');
    }
  };

  const handlePermanentDelete = async () => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this lead? This cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/api/leads/${id}`);
      alert('Lead deleted permanently.');
      navigate('/leads');
    } catch (err) {
      alert('Failed to delete lead');
    }
  };

  if (loading) {
    return <div className="leaddetails-page">Loading lead details dossier...</div>;
  }
  if (!lead) {
    return <div className="leaddetails-page">Lead not found.</div>;
  }

  return (
    <div className="leaddetails-page">
      {/* Top Header */}
      <div>
        <button className="back-button" onClick={() => navigate(-1)}>
          ← Back to List
        </button>

        <div className="leaddetails-topbar">
          <div className="leaddetails-header-info">
            <h2>{lead.firstName} {lead.lastName}</h2>
            <span className={getStatusBadgeClass(lead.status)}>
              {formatStatus(lead.status)}
            </span>
          </div>

          {auth?.role === 'ADMIN' && lead.status !== 'CLOSED' && (
            <button className="close-lead-btn" onClick={() => setShowCloseModal(true)}>
              Close Lead
            </button>
          )}
        </div>
      </div>

      <div className="leaddetails-grid">
        {/* Left Column: Contact Dossier & Assignment */}
        <div>
          <div className="leaddetails-card">
            <h3>Contact Details</h3>
            <div className="detail-row">
              <strong>Phone:</strong>
              <span>{lead.phone || '—'}</span>
            </div>
            <div className="detail-row">
              <strong>Email:</strong>
              <span>{lead.email || '—'}</span>
            </div>
            <div className="detail-row">
              <strong>Company:</strong>
              <span>{lead.company || '—'}</span>
            </div>
            <div className="detail-row">
              <strong>City:</strong>
              <span>{lead.city || '—'}</span>
            </div>
            <div className="detail-row">
              <strong>State:</strong>
              <span>{lead.state || '—'}</span>
            </div>
            {lead.address && (
              <div className="detail-row">
                <strong>Address:</strong>
                <span>{lead.address}</span>
              </div>
            )}
            {lead.category && (
              <div className="detail-row">
                <strong>Category:</strong>
                <span>{lead.category}</span>
              </div>
            )}
            {lead.rating && (
              <div className="detail-row">
                <strong>Rating:</strong>
                <span>{lead.rating}</span>
              </div>
            )}
            {lead.openHours && (
              <div className="detail-row">
                <strong>Open Hours:</strong>
                <span>{lead.openHours}</span>
              </div>
            )}

            {(lead.website || lead.mapUrl || lead.facebook || lead.instagram || lead.twitter) && (
              <>
                <h3 style={{ marginTop: '1.5rem' }}>Web &amp; Social Links</h3>
                <div className="links-list">
                  {lead.website && (
                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer">
                      🌐 Website
                    </a>
                  )}
                  {lead.mapUrl && (
                    <a href={lead.mapUrl} target="_blank" rel="noreferrer">
                      📍 View on Maps
                    </a>
                  )}
                  {lead.facebook && <a href={lead.facebook} target="_blank" rel="noreferrer">Facebook</a>}
                  {lead.instagram && <a href={lead.instagram} target="_blank" rel="noreferrer">Instagram</a>}
                  {lead.twitter && <a href={lead.twitter} target="_blank" rel="noreferrer">Twitter</a>}
                </div>
              </>
            )}
          </div>

          <div className="leaddetails-card">
            <h3>Current Assignment</h3>
            {assignments.length > 0 && !assignments[0].unassignedAt ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Assigned to <strong>{assignments[0].assignedTo?.fullName || assignments[0].assignedTo?.username}</strong> on {new Date(assignments[0].assignedAt).toLocaleString()}
              </p>
            ) : (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Not currently assigned to an agent.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Call History, Notes & Audit */}
        <div>
          <div className="leaddetails-card call-history-section">
            <div className="call-history-header">
              <div>
                <h3>Call History</h3>
                <p className="call-history-subtitle">Lead engagement timeline</p>
              </div>
              <span className="call-history-count">{callHistory.length} total</span>
            </div>

            {callHistoryLoading ? (
              <div className="call-history-status call-history-loading">
                <span className="loading-spinner" aria-hidden="true"></span>
                <span>Loading call history...</span>
              </div>
            ) : callHistoryError ? (
              <div className="call-history-status call-history-error">
                <p>{callHistoryError}</p>
                <button className="retry-call-history-btn" onClick={fetchData}>Retry</button>
              </div>
            ) : callHistory.length === 0 ? (
              <div className="call-history-empty">
                <h4>No calls yet</h4>
                <p>No call history is available for this lead.</p>
              </div>
            ) : (
              <div className="call-history-list">
                {callHistory.map((call) => (
                  <div key={call.callId} className="call-history-item">
                    <div className="call-history-topline">
                      <div>
                        <div className="call-history-agent">{call.user?.username || 'Agent'}</div>
                        <div className="call-history-datetime">{formatCallDateTime(call.startTime)}</div>
                      </div>
                      <span className="call-history-status-pill">{call.callStatus || 'Unknown'}</span>
                    </div>

                    <div className="call-history-metrics">
                      <div className="call-history-metric">
                        <span className="metric-label">Duration</span>
                        <span className="metric-value">{formatDuration(call.durationSeconds)}</span>
                      </div>
                      <div className="call-history-metric">
                        <span className="metric-label">Direction</span>
                        <span className="metric-value">{call.direction || '—'}</span>
                      </div>
                      <div className="call-history-metric">
                        <span className="metric-label">From</span>
                        <span className="metric-value">{call.fromNumber || '—'}</span>
                      </div>
                      <div className="call-history-metric">
                        <span className="metric-label">To</span>
                        <span className="metric-value">{call.toNumber || '—'}</span>
                      </div>
                    </div>

                    <div className="call-history-detail-grid">
                      <div className="call-history-field">
                        <span className="field-label">Disposition</span>
                        <span>{call.disposition?.dispositionName || '—'}</span>
                      </div>
                      <div className="call-history-field">
                        <span className="field-label">Disposition Description</span>
                        <span>{call.disposition?.description || '—'}</span>
                      </div>
                    </div>

                    <div className="call-history-notes">
                      <span className="field-label">Notes</span>
                      <p>{call.notes || 'No notes provided.'}</p>
                    </div>

                    <div className="call-history-recording">
                      <span className="field-label">Recording</span>
                      {call.recordingUrl ? (
                        <audio controls preload="none" src={call.recordingUrl} className="call-history-audio" />
                      ) : (
                        <p className="call-history-no-recording">No recording available</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="leaddetails-card">
            <h3>Assignment Audit Trail</h3>
            {assignments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No assignment history recorded.</p>
            ) : (
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {assignments.map((a) => (
                  <li key={a.assignmentId} style={{ marginBottom: '0.5rem' }}>
                    Assigned to <strong>{a.assignedTo?.fullName || a.assignedTo?.username}</strong> by {a.assignedBy?.fullName || a.assignedBy?.username} on {new Date(a.assignedAt).toLocaleString()}
                    {a.unassignedAt && <span> (Unassigned on {new Date(a.unassignedAt).toLocaleString()})</span>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Close Lead Modal */}
      {showCloseModal && (
        <div className="close-modal-overlay" onClick={() => setShowCloseModal(false)}>
          <div className="close-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Close Lead</h3>
            <p>Select how you would like to process closing this lead:</p>
            <div className="close-modal-actions">
              <button className="close-btn-just" onClick={handleJustClose}>
                Just Close (Keep Record)
              </button>
              <button className="close-btn-delete" onClick={handlePermanentDelete}>
                Permanently Delete from Database
              </button>
              <button className="close-btn-cancel" onClick={() => setShowCloseModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
