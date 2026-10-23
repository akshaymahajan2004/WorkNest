import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CalendarOff,
  Plus,
  Check,
  X,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { leaveApi } from '../services/api';
import { Leave, LeaveBalance, LeaveType, LeaveStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const Leaves: React.FC = () => {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [balance, setBalance] = useState<LeaveBalance | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [filterType, setFilterType] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Apply Leave Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [applyForm, setApplyForm] = useState({
    leaveType: 'ANNUAL' as LeaveType,
    startDate: '',
    endDate: '',
    reason: ''
  });

  // Reject Modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { role, user } = useAuth();

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterType !== 'ALL') params.leaveType = filterType;
      if (filterStatus !== 'ALL') params.status = filterStatus;

      const res = await leaveApi.getAll(params);
      if (res.success) {
        setLeaves(res.data);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalances = async () => {
    try {
      const res = await leaveApi.getBalances();
      if (res.success) {
        setBalance(res.data);
      }
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchBalances();
  }, [filterType, filterStatus]);

  // Calculate days between start & end
  const calculateDays = () => {
    if (!applyForm.startDate || !applyForm.endDate) return 1;
    const start = new Date(applyForm.startDate);
    const end = new Date(applyForm.endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleApplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const days = calculateDays();
    if (days <= 0) {
      toast.error('End date cannot be earlier than start date');
      return;
    }

    try {
      setSubmitting(true);
      const res = await leaveApi.apply({
        ...applyForm,
        totalDays: days
      });
      if (res.success) {
        toast.success(res.message || 'Leave application submitted successfully');
        setIsApplyOpen(false);
        setApplyForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
        fetchLeaves();
        fetchBalances();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to apply for leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReview = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      setSubmitting(true);
      const res = await leaveApi.review(id, {
        status,
        rejectionReason: reason
      });
      if (res.success) {
        toast.success(res.message || `Leave application marked as ${status}`);
        setIsRejectOpen(false);
        setSelectedLeaveId(null);
        setRejectionReason('');
        fetchLeaves();
        fetchBalances();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to review leave');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');
  const historyLeaves = leaves.filter(l => l.status !== 'PENDING');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Leave Balances Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Annual Leave
            </span>
            <span className="badge badge-primary">2026 Quota</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {balance?.annualRemaining ?? 15} <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)', fontWeight: 500 }}>/ {balance?.annualTotal ?? 15} days</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--slate-100)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(((balance?.annualUsed ?? 0) / (balance?.annualTotal ?? 15)) * 100)}%`,
                backgroundColor: 'var(--primary-600)'
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.375rem', display: 'block' }}>
            {balance?.annualUsed ?? 0} days utilized this fiscal year
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Sick Leave
            </span>
            <span className="badge badge-warning">Medical</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {balance?.sickRemaining ?? 10} <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)', fontWeight: 500 }}>/ {balance?.sickTotal ?? 10} days</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--slate-100)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(((balance?.sickUsed ?? 0) / (balance?.sickTotal ?? 10)) * 100)}%`,
                backgroundColor: 'var(--warning-500)'
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.375rem', display: 'block' }}>
            {balance?.sickUsed ?? 0} days utilized
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success-500)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Casual Leave
            </span>
            <span className="badge badge-success">Personal</span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {balance?.casualRemaining ?? 10} <span style={{ fontSize: '0.875rem', color: 'var(--slate-400)', fontWeight: 500 }}>/ {balance?.casualTotal ?? 10} days</span>
          </div>
          <div style={{ height: '6px', backgroundColor: 'var(--slate-100)', borderRadius: 'var(--radius-full)', marginTop: '0.75rem', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${Math.round(((balance?.casualUsed ?? 0) / (balance?.casualTotal ?? 10)) * 100)}%`,
                backgroundColor: 'var(--success-500)'
              }}
            />
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '0.375rem', display: 'block' }}>
            {balance?.casualUsed ?? 0} days utilized
          </span>
        </div>
      </div>

      {/* Main Container: Tabs & Actions */}
      <div className="card">
        <div
          className="card-header"
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem'
          }}
        >
          {/* Tab buttons */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('pending')}
            >
              <span>Pending Requests</span>
              {pendingLeaves.length > 0 && (
                <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.25)', padding: '0.1rem 0.4rem', borderRadius: 'var(--radius-full)', fontSize: '0.75rem' }}>
                  {pendingLeaves.length}
                </span>
              )}
            </button>
            <button
              className={`btn btn-sm ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('history')}
            >
              <span>Leave History</span>
            </button>
          </div>

          {/* Action: Apply for Leave */}
          <button className="btn btn-primary btn-sm" onClick={() => setIsApplyOpen(true)}>
            <Plus size={16} />
            <span>Apply for Leave</span>
          </button>
        </div>

        {/* Content Table */}
        <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
          <table className="table">
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Leave Type</th>
                <th>Duration</th>
                <th>Dates Range</th>
                <th>Reason / Justification</th>
                <th>Status</th>
                <th>Reviewed By</th>
                {(role === 'ADMIN' || role === 'HR') && activeTab === 'pending' && (
                  <th style={{ textAlign: 'right' }}>Decisions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--slate-500)' }}>Loading leave records...</p>
                  </td>
                </tr>
              ) : (activeTab === 'pending' ? pendingLeaves : historyLeaves).length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ color: 'var(--slate-500)' }}>
                      {activeTab === 'pending' ? 'No pending leave applications.' : 'No leave history records found.'}
                    </p>
                  </td>
                </tr>
              ) : (
                (activeTab === 'pending' ? pendingLeaves : historyLeaves).map(leave => (
                  <tr key={leave.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <img
                          src={leave.employee.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                          alt=""
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                            {leave.employee.firstName} {leave.employee.lastName}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>
                            {leave.employee.employeeCode}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-primary">{leave.leaveType}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--slate-800)' }}>
                      {leave.totalDays} Day(s)
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                      {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} – {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', maxWidth: '240px' }}>
                      {leave.reason}
                      {leave.rejectionReason && (
                        <div style={{ color: 'var(--danger-600)', fontSize: '0.75rem', marginTop: '2px', fontWeight: 500 }}>
                          Reason: {leave.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          leave.status === 'APPROVED' ? 'badge-success' :
                          leave.status === 'PENDING' ? 'badge-warning' : 'badge-danger'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {leave.reviewedBy || 'Pending'}
                    </td>
                    {(role === 'ADMIN' || role === 'HR') && activeTab === 'pending' && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            style={{ backgroundColor: 'var(--success-600)', padding: '0.3rem 0.6rem' }}
                            onClick={() => handleReview(leave.id, 'APPROVED')}
                            disabled={submitting}
                          >
                            <Check size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ color: 'var(--danger-600)', padding: '0.3rem 0.6rem' }}
                            onClick={() => {
                              setSelectedLeaveId(leave.id);
                              setIsRejectOpen(true);
                            }}
                            disabled={submitting}
                          >
                            <X size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Apply Leave Modal */}
      <Modal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        title="Submit Leave Application"
        maxWidth="500px"
      >
        <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Leave Type</label>
            <select
              className="select"
              value={applyForm.leaveType}
              onChange={e => setApplyForm({ ...applyForm, leaveType: e.target.value as LeaveType })}
            >
              <option value="ANNUAL">Annual Leave (15 days/yr)</option>
              <option value="SICK">Sick Leave (10 days/yr)</option>
              <option value="CASUAL">Casual Leave (10 days/yr)</option>
              <option value="MATERNITY">Maternity / Paternity</option>
              <option value="UNPAID">Unpaid Leave</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Start Date *</label>
              <input
                type="date"
                className="input"
                required
                value={applyForm.startDate}
                onChange={e => setApplyForm({ ...applyForm, startDate: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">End Date *</label>
              <input
                type="date"
                className="input"
                required
                value={applyForm.endDate}
                onChange={e => setApplyForm({ ...applyForm, endDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ padding: '0.625rem 0.875rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--primary-700)', fontWeight: 600 }}>Total Duration:</span>
            <strong style={{ fontSize: '1rem', color: 'var(--primary-900)' }}>{calculateDays()} Day(s)</strong>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Reason / Justification *</label>
            <textarea
              className="textarea"
              rows={3}
              required
              placeholder="Explain the purpose of your time-off request..."
              value={applyForm.reason}
              onChange={e => setApplyForm({ ...applyForm, reason: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsApplyOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Leave Application"
        maxWidth="450px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-600)' }}>
            Please provide a specific reason for declining this leave request:
          </p>
          <textarea
            className="textarea"
            rows={3}
            placeholder="e.g. Critical project milestone scheduled; please reschedule."
            value={rejectionReason}
            onChange={e => setRejectionReason(e.target.value)}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button className="btn btn-secondary" onClick={() => setIsRejectOpen(false)}>
              Cancel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => selectedLeaveId && handleReview(selectedLeaveId, 'REJECTED', rejectionReason)}
              disabled={submitting || !rejectionReason.trim()}
            >
              {submitting ? 'Rejecting...' : 'Confirm Rejection'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
