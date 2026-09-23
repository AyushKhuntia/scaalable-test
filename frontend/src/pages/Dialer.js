import React, { useEffect, useState } from 'react';
import api from '../api';
import './Dialer.css';

const formatStatus = (status) => String(status || 'NEW').replace(/_/g, ' ');

const getStatusBadgeClass = (status) => {
  const s = String(status || 'NEW').toLowerCase().replace(/_/g, '-');
  return `badge badge-${s}`;
};

export default function Dialer({ auth }) {
  const [lead, setLead] = useState(null);
  const [leads, setLeads] = useState([]);
  const [number, setNumber] = useState('');
  const [agentPhone, setAgentPhone] = useState(() => localStorage.getItem('agentPhone') || '');
  const [callInfo, setCallInfo] = useState(null);
  const [dispositions, setDispositions] = useState([]);
  const [dispositionId, setDispositionId] = useState('');
  const [notes, setNotes] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [history, setHistory] = useState([]);
  const [dialMode, setDialMode] = useState('queue'); // 'queue' | 'custom'
  const [autoCreateLead, setAutoCreateLead] = useState(true);
  const [customDestination, setCustomDestination] = useState('');
  const [countryCode, setCountryCode] = useState('+91');

  useEffect(() => {
    // If "Call" was clicked in My Leads, pre-select that lead
    const pre = sessionStorage.getItem('dialLead');
    if (pre) {
      try {
        setLead(JSON.parse(pre));
      } catch (e) {
        console.error(e);
      }
      sessionStorage.removeItem('dialLead');
    }
    api.get('/api/calls/dispositions').then((r) => setDispositions(r.data || [])).catch(() => {});
    api.get('/api/leads?size=1000').then((r) => setLeads(r.data?.content || r.data || [])).catch(() => {});
  }, []);

  const safeLeads = Array.isArray(leads) ? leads : [];

  useEffect(() => {
    if (lead?.leadId) {
      api.get(`/api/calls/lead/${lead.leadId}`).then((r) => setHistory(r.data || [])).catch(() => {});
      setNumber(lead.phone || '');
      setCallInfo(null);
      setDispositionId('');
      setNotes('');
      setMsg('');
      setErr('');
    }
  }, [lead]);

  const pickLead = async (id) => {
    if (!id) return setLead(null);
    try {
      const { data } = await api.get(`/api/leads/${id}`);
      setLead(data);
    } catch (e) {
      console.error(e);
    }
  };

  const dial = async () => {
    setErr('');
    setMsg('');
    
    let targetNumber = dialMode === 'custom' ? (countryCode + customDestination) : number;
    let targetLeadId = lead?.leadId || null;

    if (dialMode === 'queue') {
      if (!lead || !number) {
        setErr('Please select a lead and enter a valid phone number.');
        return;
      }
    } else {
      if (!customDestination) {
        setErr('Please enter a destination phone number.');
        return;
      }
      if (autoCreateLead) {
        try {
          const res = await api.post('/api/leads', {
            firstName: 'Custom',
            lastName: 'Call',
            phone: targetNumber,
            status: 'NEW',
            source: 'WEB'
          });
          targetLeadId = res.data.leadId;
          setLead(res.data);
        } catch (e) {
          setErr('Failed to auto-create lead.');
          return;
        }
      }
    }

    const myPhone = agentPhone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(myPhone)) {
      setErr('Enter YOUR agent phone number in E.164 format (e.g. +919876543210) for callback purposes.');
      return;
    }
    localStorage.setItem('agentPhone', myPhone);

    try {
      const { data } = await api.post('/api/calls/dial', {
        leadId: targetLeadId,
        to: targetNumber,
        agentPhone: myPhone,
      });
      setCallInfo(data);
      setMsg(
        data.dryRun
          ? 'Dry-run call logged (Plivo credentials not configured on backend).'
          : `Call initiated via Plivo (Call ID: ${data.providerCallId}).`
      );
    } catch (e) {
      setErr(e.response?.data?.error || 'Call initiation failed.');
    }
  };

  const saveOutcome = async () => {
    setErr('');
    setMsg('');
    if (!callInfo?.callId) {
      setErr('Place a call first before logging an outcome.');
      return;
    }

    try {
      await api.post('/api/calls/outcome', {
        callId: callInfo.callId,
        dispositionId: dispositionId ? Number(dispositionId) : null,
        notes,
      });
      setMsg('Call outcome saved successfully.');
      if (lead?.leadId) {
        api.get(`/api/calls/lead/${lead.leadId}`).then((r) => setHistory(r.data || [])).catch(() => {});
      }
    } catch (e) {
      setErr(e.response?.data?.error || 'Could not save call outcome.');
    }
  };

  return (
    <div className="dialer-page">
      {/* Header */}
      <div className="dialer-header">
        <div>
          <div className="page-eyebrow">Call Center Workstation</div>
          <h1>Web Dialer</h1>
          <p>Outbound VoIP calling station with automated lead logging and disposition tagging.</p>
        </div>
      </div>

      {err && <div className="dialer-error">{err}</div>}
      {msg && <div className="dialer-success">{msg}</div>}

      <div className="dialer-grid">
        {/* Left Station: Call Controls & Outcome */}
        <div>
          <div className="dialer-card">
            <h2 className="dialer-card-title dialer-card-title-with-tabs">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>Outbound Station</span>
              </div>
              <div className="dialer-tabs">
                <button className={dialMode === 'queue' ? 'active' : ''} onClick={() => setDialMode('queue')}>
                  Lead Queue
                </button>
                <button className={dialMode === 'custom' ? 'active' : ''} onClick={() => setDialMode('custom')}>
                  Custom Direct Call
                </button>
              </div>
            </h2>

            {dialMode === 'queue' ? (
              <div className="field-group">
                <label>Select Target Lead</label>
                <select value={lead?.leadId || ''} onChange={(e) => pickLead(e.target.value)}>
                  <option value="">Choose a lead from queue...</option>
                  {safeLeads.map((l) => (
                    <option key={l.leadId} value={l.leadId}>
                      {l.firstName} {l.lastName} — {l.phone} {l.company ? `(${l.company})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div className="field-group">
                  <label>Direct Destination Phone Number (E.164)</label>
                  <div className="phone-input-group">
                    <select value={countryCode} onChange={(e) => setCountryCode(e.target.value)} className="country-select">
                      <option value="+91">IN +91 (IN)</option>
                      <option value="+1">US +1 (US)</option>
                      <option value="+44">UK +44 (UK)</option>
                      <option value="+61">AU +61 (AU)</option>
                    </select>
                    <input
                      type="text"
                      value={customDestination}
                      onChange={(e) => setCustomDestination(e.target.value)}
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                <div className="field-group checkbox-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', textTransform: 'none', fontWeight: '500' }}>
                    <input
                      type="checkbox"
                      checked={autoCreateLead}
                      onChange={(e) => setAutoCreateLead(e.target.checked)}
                      style={{ width: 'auto', margin: 0 }}
                    />
                    Auto-create and log this custom direct call as a new CRM lead record
                  </label>
                </div>
              </>
            )}

            <div className="field-row">
              <div className="field-group">
                <label>Your Agent Phone (E.164)</label>
                <input
                  type="text"
                  value={agentPhone}
                  onChange={(e) => setAgentPhone(e.target.value)}
                  placeholder="+919876543210"
                />
              </div>

              <div className="field-group">
                <label>Number to Dial (E.164)</label>
                <input
                  type="text"
                  value={dialMode === 'custom' ? (customDestination ? countryCode + customDestination : '') : number}
                  onChange={(e) => setNumber(e.target.value)}
                  placeholder="+919876543210"
                  readOnly={dialMode === 'custom'}
                  style={dialMode === 'custom' ? { backgroundColor: '#f3f4f6', color: '#6b7280' } : {}}
                />
              </div>
            </div>

            <button className="btn-place-call" onClick={dial} disabled={dialMode === 'queue' && !lead}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>Place Call Now</span>
            </button>

            {callInfo && (
              <div className="call-status-banner">
                <div className="call-status-pulse" />
                <div>
                  <strong>Active Session #{callInfo.callId}</strong> — Status: {callInfo.status}
                  {callInfo.dryRun && <span> (Dry-run mode)</span>}
                </div>
              </div>
            )}
          </div>

          <div className="dialer-card">
            <h2 className="dialer-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Call Disposition &amp; Notes</span>
            </h2>

            <div className="field-group">
              <label>Select Disposition Outcome</label>
              <select value={dispositionId} onChange={(e) => setDispositionId(e.target.value)}>
                <option value="">— Select disposition —</option>
                {dispositions.map((d) => (
                  <option key={d.dispositionId} value={d.dispositionId}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field-group">
              <label>Call Notes / Remarks</label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter call notes, customer reaction, or next follow-up agreement..."
              />
            </div>

            <button className="btn-save-outcome" onClick={saveOutcome} disabled={!callInfo}>
              Save Call Outcome
            </button>
          </div>
        </div>

        {/* Right Station: Lead Dossier & History */}
        <div>
          <div className="dialer-card">
            <h2 className="dialer-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span>Selected Lead Dossier</span>
            </h2>

            {lead ? (
              <table className="lead-dossier-table">
                <tbody>
                  <tr>
                    <th>Lead Name</th>
                    <td>{lead.firstName} {lead.lastName}</td>
                  </tr>
                  <tr>
                    <th>Phone</th>
                    <td>{lead.phone}</td>
                  </tr>
                  <tr>
                    <th>Alt Phone</th>
                    <td>{lead.altPhone || '—'}</td>
                  </tr>
                  <tr>
                    <th>Email</th>
                    <td>{lead.email || '—'}</td>
                  </tr>
                  <tr>
                    <th>Company</th>
                    <td>{lead.company || '—'}</td>
                  </tr>
                  <tr>
                    <th>City</th>
                    <td>{lead.city || '—'}</td>
                  </tr>
                  <tr>
                    <th>Status</th>
                    <td>
                      <span className={getStatusBadgeClass(lead.status)}>
                        {formatStatus(lead.status)}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No lead selected. Click "Call" on My Leads or pick a lead from the dropdown.
              </p>
            )}
          </div>

          <div className="dialer-card">
            <h2 className="dialer-card-title">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Call History ({lead ? `${lead.firstName}` : 'Lead'})</span>
            </h2>

            {history.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No previous calls logged for this lead.</p>
            ) : (
              <div className="call-history-list">
                {history.map((c) => (
                  <div key={c.callId} className="call-history-item">
                    <div className="call-history-header">
                      <strong>Call #{c.callId} → {c.toNumber}</strong>
                      <span className="badge badge-assigned">{c.callStatus}</span>
                    </div>
                    {c.disposition && (
                      <div style={{ marginTop: '4px' }}>
                        <span className="badge badge-new">{c.disposition.dispositionName}</span>
                      </div>
                    )}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {c.startTime?.replace('T', ' ').slice(0, 16)}
                    </div>
                    {c.notes && <div className="call-history-notes">"{c.notes}"</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
