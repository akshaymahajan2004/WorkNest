import React, { useState, useEffect } from 'react';
import {
  Clock,
  Calendar,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Filter,
  Edit2,
  LogIn,
  LogOut,
  UserCheck
} from 'lucide-react';
import { attendanceApi, departmentApi } from '../services/api';
import { Attendance, AttendanceStatus, Department } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const AttendancePage: React.FC = () => {
  const [roster, setRoster] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, present: 0, late: 0, halfDay: 0, absent: 0 });
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [loading, setLoading] = useState(true);

  // Mark/Edit Attendance Modal
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [markForm, setMarkForm] = useState({
    employeeId: '',
    employeeName: '',
    date: selectedDate,
    status: 'PRESENT',
    checkIn: '',
    checkOut: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const { toast } = useToast();
  const { role, user } = useAuth();

  const fetchRoster = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { date: selectedDate };
      if (selectedDept !== 'ALL') params.departmentId = selectedDept;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;

      const res = await attendanceApi.getRoster(params);
      if (res.success) {
        setRoster(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch attendance roster');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getAll();
      if (res.success) setDepartments(res.data);
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchRoster();
  }, [selectedDate, selectedDept, selectedStatus]);

  const openMarkModal = (record: any) => {
    setSelectedRecord(record);
    const checkInStr = record.checkIn ? new Date(record.checkIn).toISOString().slice(0, 16) : '';
    const checkOutStr = record.checkOut ? new Date(record.checkOut).toISOString().slice(0, 16) : '';

    setMarkForm({
      employeeId: record.employee.id,
      employeeName: `${record.employee.firstName} ${record.employee.lastName}`,
      date: selectedDate,
      status: record.status || 'PRESENT',
      checkIn: checkInStr,
      checkOut: checkOutStr,
      notes: record.notes || ''
    });
    setIsMarkOpen(true);
  };

  const handleMarkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await attendanceApi.mark({
        employeeId: markForm.employeeId,
        date: markForm.date,
        status: markForm.status,
        checkIn: markForm.checkIn ? new Date(markForm.checkIn).toISOString() : null,
        checkOut: markForm.checkOut ? new Date(markForm.checkOut).toISOString() : null,
        notes: markForm.notes
      });
      if (res.success) {
        toast.success('Attendance record updated successfully');
        setIsMarkOpen(false);
        fetchRoster();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  const attendanceRate = summary.total > 0
    ? Math.round(((summary.present + summary.late + summary.halfDay * 0.5) / summary.total) * 100)
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Daily Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--primary-600)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Roster Total
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {summary.total} Employees
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary-600)', fontWeight: 600 }}>
            {attendanceRate}% attendance rate
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            On-Time Present
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            {summary.present}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Checked in on schedule</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--warning-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Late Arrival
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--warning-600)', marginTop: '0.25rem' }}>
            {summary.late}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>After 9:30 AM threshold</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--purple-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Half Day
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--purple-600)', marginTop: '0.25rem' }}>
            {summary.halfDay}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Under 5 operating hours</span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Absent / Unreported
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--danger-600)', marginTop: '0.25rem' }}>
            {summary.absent}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>No punch records</span>
        </div>
      </div>

      {/* Date & Filter Ribbon */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary-600)" />
            <input
              type="date"
              className="input"
              style={{ width: 'auto' }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
          >
            Today
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedDept}
            onChange={e => setSelectedDept(e.target.value)}
          >
            <option value="ALL">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedStatus}
            onChange={e => setSelectedStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="HALF_DAY">Half Day</option>
            <option value="ABSENT">Absent</option>
          </select>
        </div>
      </div>

      {/* Daily Attendance Roster Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Punch In</th>
              <th>Punch Out</th>
              <th>Duration</th>
              <th>Status</th>
              <th>Notes / Remarks</th>
              {(role === 'ADMIN' || role === 'HR') && <th style={{ textAlign: 'right' }}>Action</th>}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--slate-500)' }}>Retrieving daily attendance roster...</p>
                </td>
              </tr>
            ) : roster.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--slate-500)' }}>No attendance entries found for this date.</p>
                </td>
              </tr>
            ) : (
              roster.map(r => (
                <tr key={r.employee.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={r.employee.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                        alt=""
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>
                          {r.employee.firstName} {r.employee.lastName}
                        </div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                          {r.employee.employeeCode}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-primary">{r.employee.department?.name || 'General'}</span>
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                      <span style={{ color: 'var(--slate-400)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 500 }}>
                    {r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                      <span style={{ color: 'var(--slate-400)' }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--slate-700)' }}>
                    {r.workHours > 0 ? `${r.workHours} hrs` : '0 hrs'}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        r.status === 'PRESENT' ? 'badge-success' :
                        r.status === 'LATE' ? 'badge-warning' :
                        r.status === 'HALF_DAY' ? 'badge-slate' : 'badge-danger'
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)', maxWidth: '200px' }}>
                    {r.notes || '—'}
                  </td>
                  {(role === 'ADMIN' || role === 'HR') && (
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.6rem' }}
                        onClick={() => openMarkModal(r)}
                      >
                        <Edit2 size={14} />
                        <span>Adjust</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Adjust / Mark Attendance Modal */}
      <Modal
        isOpen={isMarkOpen}
        onClose={() => setIsMarkOpen(false)}
        title={`Adjust Attendance: ${markForm.employeeName}`}
        maxWidth="500px"
      >
        <form onSubmit={handleMarkSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Attendance Status</label>
            <select
              className="select"
              value={markForm.status}
              onChange={e => setMarkForm({ ...markForm, status: e.target.value })}
            >
              <option value="PRESENT">PRESENT (On-time)</option>
              <option value="LATE">LATE (Delayed check-in)</option>
              <option value="HALF_DAY">HALF DAY (&lt; 5 hours)</option>
              <option value="ABSENT">ABSENT</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Check In Timestamp</label>
              <input
                type="datetime-local"
                className="input"
                value={markForm.checkIn}
                onChange={e => setMarkForm({ ...markForm, checkIn: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Check Out Timestamp</label>
              <input
                type="datetime-local"
                className="input"
                value={markForm.checkOut}
                onChange={e => setMarkForm({ ...markForm, checkOut: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Notes / Justification</label>
            <textarea
              className="textarea"
              rows={2}
              placeholder="e.g. Authorized transit delay, remote half-day approved."
              value={markForm.notes}
              onChange={e => setMarkForm({ ...markForm, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsMarkOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Update Record'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
