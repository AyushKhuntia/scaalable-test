import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import './Leads.css';

const STATUS_OPTIONS = [
  'ALL',
  'NEW',
  'ASSIGNED',
  'CONTACTED',
  'FOLLOW_UP',
  'NOT_INTERESTED',
  'CONVERTED',
  'CLOSED',
];

const STATUS_LABELS = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  CONTACTED: 'Contacted',
  FOLLOW_UP: 'Follow Up',
  NOT_INTERESTED: 'Not Interested',
  CONVERTED: 'Converted',
  CLOSED: 'Closed',
};

export default function Leads({ auth }) {
  const canManage = auth?.role === 'ADMIN' || auth?.role === 'MANAGER';

  const [leads, setLeads] = useState([]);
  const [agents, setAgents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [page, setPage] = useState(0);
  const [size] = useState(10);

  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedLeads, setSelectedLeads] = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLeadId, setDeleteLeadId] = useState(null);

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState(null);

  const [leadForm, setLeadForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    company: '',
    city: '',
    status: 'NEW',
  });

  useEffect(() => {
    loadLeads();
  }, [page, searchQuery, filterStatus]);

  useEffect(() => {
    if (canManage) {
      loadAgents();
    }
  }, [canManage]);

  const loadLeads = async () => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        page,
        size,
      });

      if (searchQuery.trim()) {
        params.append('search', searchQuery.trim());
      }

      if (filterStatus !== 'ALL') {
        params.append('status', filterStatus);
      }

      const response = await api.get(`/api/leads?${params.toString()}`);

      const data = response.data;

      setLeads(data?.content || data || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);

      setSelectedLeads([]);
    } catch (err) {
      console.error(err);
      setError('Unable to load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await api.get('/api/users/role/AGENT');
      setAgents(response.data || []);
    } catch (err) {
      console.error('Unable to load agents', err);
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    setPage(0);
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
    setPage(0);
  };

  const toggleSelectLead = (leadId) => {
    if (!canManage) return;
    setSelectedLeads((current) =>
      current.includes(leadId)
        ? current.filter((id) => id !== leadId)
        : [...current, leadId]
    );
  };

  const toggleSelectAll = () => {
    if (!canManage) return;
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(leads.map((lead) => lead.leadId));
    }
  };

  const openAddLead = () => {
    if (!canManage) return;
    setEditingLead(null);
    setLeadForm({
      firstName: '',
      lastName: '',
      phone: '',
      company: '',
      city: '',
      status: 'NEW',
    });
    setShowLeadModal(true);
  };

  const openEditLead = (lead) => {
    if (!canManage) return;
    setEditingLead(lead);

    setLeadForm({
      firstName: lead.firstName || '',
      lastName: lead.lastName || '',
      phone: lead.phone || '',
      company: lead.company || '',
      city: lead.city || '',
      status: lead.status || 'NEW',
    });

    setShowLeadModal(true);
  };

  const handleLeadFormChange = (e) => {
    const { name, value } = e.target;

    setLeadForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const saveLead = async (e) => {
    e.preventDefault();
    if (!canManage) return;

    try {
      if (editingLead) {
        await api.put(`/api/leads/${editingLead.leadId}`, leadForm);
      } else {
        await api.post('/api/leads', leadForm);
      }

      setShowLeadModal(false);
      await loadLeads();
    } catch (err) {
      console.error(err);
      alert('Unable to save lead.');
    }
  };

  const confirmDelete = (leadId) => {
    if (!canManage) return;
    setDeleteLeadId(leadId);
    setShowDeleteModal(true);
  };

  const deleteLead = async () => {
    if (!deleteLeadId || !canManage) return;

    try {
      await api.post('/api/leads/bulk-delete', {
        leadIds: [deleteLeadId],
      });

      setShowDeleteModal(false);
      setDeleteLeadId(null);

      await loadLeads();
    } catch (err) {
      console.error(err);
      alert('Unable to delete lead.');
    }
  };

  const openAssignModal = () => {
    if (!canManage) return;
    if (selectedLeads.length === 0) {
      alert('Select at least one lead.');
      return;
    }

    setSelectedAgent('');
    setShowAssignModal(true);
  };

  const assignLeads = async () => {
    if (!canManage) return;
    if (!selectedAgent) {
      alert('Please select an agent.');
      return;
    }

    try {
      if (selectedLeads.length === 1) {
        await api.post('/api/assignments', {
          leadId: selectedLeads[0],
          assignedTo: Number(selectedAgent),
        });
      } else {
        await api.post('/api/assignments/bulk', {
          leadIds: selectedLeads,
          assignedTo: Number(selectedAgent),
        });
      }

      setShowAssignModal(false);
      setSelectedAgent('');
      setSelectedLeads([]);

      await loadLeads();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert('Unable to assign leads. Details: ' + JSON.stringify(err.response?.data || msg));
    }
  };

  const assignRoundRobin = async () => {
    if (!canManage) return;
    if (selectedLeads.length === 0) {
      alert('Select at least one lead.');
      return;
    }

    try {
      await api.post('/api/assignments/round-robin', {
        leadIds: selectedLeads,
        agentIds: agents.map(a => a.userId || a.id)
      });

      setSelectedLeads([]);
      await loadLeads();
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message || 'Unknown error';
      alert('Unable to assign leads using round-robin. Details: ' + JSON.stringify(err.response?.data || msg));
    }
  };

  const formatStatus = (status) => {
    return STATUS_LABELS[status] || status || 'Unknown';
  };

  const getStatusClass = (status) => {
    return `lead-status lead-status-${String(status || '')
      .toLowerCase()
      .replace(/_/g, '-')}`;
  };

  return (
    <div className="leads-page">
      <div className="leads-header">
        <div>
          <div className="page-eyebrow">CRM</div>
          <h1>Leads</h1>
          <p>Browse and track your sales pipeline leads.</p>
        </div>

        {canManage && (
          <button className="primary-action-btn" onClick={openAddLead}>
            <span>+</span>
            Add Lead
          </button>
        )}
      </div>

      <div className="leads-toolbar">
        <div className="lead-search-box">
          <span className="lead-search-icon">⌕</span>

          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            placeholder="Search leads by name, phone, company..."
          />

          {searchQuery && (
            <button
              className="clear-search-btn"
              onClick={() => {
                setSearchQuery('');
                setPage(0);
              }}
            >
              ×
            </button>
          )}
        </div>

        <div className="lead-filter-box">
          <select value={filterStatus} onChange={handleStatusFilter}>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status === 'ALL' ? 'All Statuses' : formatStatus(status)}
              </option>
            ))}
          </select>
        </div>

        {canManage && (
          <div className="lead-management-actions">
            <button
              className="secondary-action-btn"
              onClick={openAssignModal}
              disabled={selectedLeads.length === 0}
            >
              Assign
            </button>

            <button
              className="secondary-action-btn"
              onClick={assignRoundRobin}
              disabled={selectedLeads.length === 0}
            >
              Round Robin
            </button>
          </div>
        )}
      </div>

      <div className="leads-summary-row">
        <span>
          <strong>{totalElements}</strong> total leads
        </span>

        {selectedLeads.length > 0 && canManage && (
          <span className="selected-count">
            {selectedLeads.length} selected
          </span>
        )}
      </div>

      {error && (
        <div className="leads-error">
          <span>{error}</span>
          <button onClick={loadLeads}>Retry</button>
        </div>
      )}

      <div className="leads-table-card">
        <div className="leads-table-wrapper">
          <table className="leads-table">
            <thead>
              <tr>
                {canManage && (
                  <th className="checkbox-column">
                    <input
                      type="checkbox"
                      checked={
                        leads.length > 0 &&
                        selectedLeads.length === leads.length
                      }
                      onChange={toggleSelectAll}
                    />
                  </th>
                )}

                <th>Lead</th>
                <th>Company</th>
                <th>Phone</th>
                <th>City</th>
                <th>Status</th>
                <th>Assigned Agent</th>
                <th className="actions-column">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={canManage ? 8 : 7}
                    className="table-loading"
                  >
                    <div className="table-loader"></div>
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td
                    colSpan={canManage ? 8 : 7}
                    className="empty-leads"
                  >
                    <div className="empty-leads-icon">◎</div>
                    <strong>No leads found</strong>
                    <span>
                      Try changing your search or filter.
                    </span>
                  </td>
                </tr>
              ) : (
                leads.map((lead) => (
                  <tr key={lead.leadId}>
                    {canManage && (
                      <td className="checkbox-column">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.leadId)}
                          onChange={() => toggleSelectLead(lead.leadId)}
                        />
                      </td>
                    )}

                    <td>
                      <Link
                        to={`/leads/${lead.leadId}`}
                        className="lead-name-cell"
                      >
                        <span className="lead-avatar">
                          {(
                            lead.firstName?.charAt(0) ||
                            'L'
                          ).toUpperCase()}
                        </span>

                        <span>
                          <strong>
                            {[lead.firstName, lead.lastName]
                              .filter(Boolean)
                              .join(' ') || 'Unnamed Lead'}
                          </strong>

                          <small>
                            ID #{lead.leadId}
                          </small>
                        </span>
                      </Link>
                    </td>

                    <td>
                      <span className="company-cell">
                        {lead.company || '—'}
                      </span>
                    </td>

                    <td>
                      <span className="phone-cell">
                        {lead.phone || '—'}
                      </span>
                    </td>

                    <td>
                      {lead.city || '—'}
                    </td>

                    <td>
                      <span className={getStatusClass(lead.status)}>
                        <span className="status-dot"></span>
                        {formatStatus(lead.status)}
                      </span>
                    </td>

                    <td>
                      <span className="agent-cell">
                        {lead.assignedAgentName || 'Unassigned'}
                      </span>
                    </td>

                    <td className="actions-column">
                      <div className="lead-row-actions">
                        <Link
                          to={`/leads/${lead.leadId}`}
                          className="row-action view"
                          title="View lead details"
                        >
                          View
                        </Link>

                        {canManage && (
                          <>
                            <button
                              className="row-action edit"
                              onClick={() => openEditLead(lead)}
                            >
                              Edit
                            </button>

                            <button
                              className="row-action delete"
                              onClick={() =>
                                confirmDelete(lead.leadId)
                              }
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && leads.length > 0 && (
          <div className="leads-pagination">
            <div>
              Showing page <strong>{page + 1}</strong>
              {totalPages > 0 && (
                <>
                  {' '}
                  of <strong>{totalPages}</strong>
                </>
              )}
            </div>

            <div className="pagination-buttons">
              <button
                onClick={() => setPage((current) => current - 1)}
                disabled={page === 0}
              >
                ← Previous
              </button>

              <span className="current-page">
                {page + 1}
              </span>

              <button
                onClick={() => setPage((current) => current + 1)}
                disabled={
                  totalPages === 0 || page >= totalPages - 1
                }
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Lead Modal */}
      {showLeadModal && canManage && (
        <div
          className="modal-overlay"
          onClick={() => setShowLeadModal(false)}
        >
          <div
            className="lead-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>
                  {editingLead ? 'Edit Lead' : 'Add Lead'}
                </h2>

                <p>
                  {editingLead
                    ? 'Update lead information.'
                    : 'Create a new lead.'}
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowLeadModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={saveLead}>
              <div className="lead-form-grid">
                <div className="form-field">
                  <label>First Name</label>
                  <input
                    name="firstName"
                    value={leadForm.firstName}
                    onChange={handleLeadFormChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Last Name</label>
                  <input
                    name="lastName"
                    value={leadForm.lastName}
                    onChange={handleLeadFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={leadForm.phone}
                    onChange={handleLeadFormChange}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Company</label>
                  <input
                    name="company"
                    value={leadForm.company}
                    onChange={handleLeadFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>City</label>
                  <input
                    name="city"
                    value={leadForm.city}
                    onChange={handleLeadFormChange}
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    name="status"
                    value={leadForm.status}
                    onChange={handleLeadFormChange}
                  >
                    {STATUS_OPTIONS.filter(
                      (status) => status !== 'ALL'
                    ).map((status) => (
                      <option key={status} value={status}>
                        {formatStatus(status)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-secondary-btn"
                  onClick={() => setShowLeadModal(false)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-primary-btn"
                >
                  {editingLead ? 'Save Changes' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && canManage && (
        <div
          className="modal-overlay"
          onClick={() => setShowAssignModal(false)}
        >
          <div
            className="small-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Assign Leads</h2>
                <p>
                  Assign {selectedLeads.length} selected lead
                  {selectedLeads.length > 1 ? 's' : ''}.
                </p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                ×
              </button>
            </div>

            <div className="form-field">
              <label>Select Agent</label>

              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
              >
                <option value="">Choose an agent</option>

                {agents.map((agent) => (
                  <option
                    key={agent.userId || agent.id}
                    value={agent.userId || agent.id}
                  >
                    {agent.fullName ||
                      agent.username ||
                      agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button
                className="modal-secondary-btn"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>

              <button
                className="modal-primary-btn"
                onClick={assignLeads}
              >
                Assign Leads
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && canManage && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="small-modal delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-icon">!</div>

            <h2>Delete Lead?</h2>

            <p>
              This action cannot be undone. Are you sure you want
              to delete this lead?
            </p>

            <div className="modal-footer">
              <button
                className="modal-secondary-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>

              <button
                className="delete-confirm-btn"
                onClick={deleteLead}
              >
                Delete Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}