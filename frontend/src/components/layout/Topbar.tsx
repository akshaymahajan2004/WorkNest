import React, { useState, useEffect } from 'react';
import { Menu, Clock, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { attendanceApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

interface TopbarProps {
  currentTab: string;
  onOpenMobile: () => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Executive Dashboard', subtitle: 'Overview of workforce metrics, attendance, and pending requests' },
  employees: { title: 'Employee Directory', subtitle: 'Manage organization roster, profiles, and employment status' },
  departments: { title: 'Department Management', subtitle: 'Department units, budget allocations, and team members' },
  attendance: { title: 'Attendance Tracking', subtitle: 'Daily logs, check-in records, status verification, and work hours' },
  leaves: { title: 'Leave Management', subtitle: 'Time-off requests, balances, and multi-tier approval workflows' },
  payroll: { title: 'Payroll & Compensation', subtitle: 'Salary structures, monthly disbursements, and itemized pay stubs' },
  reports: { title: 'Analytics & Reports', subtitle: 'Detailed operational data exports and instant CSV generation' },
  settings: { title: 'System Settings', subtitle: 'Enterprise preferences, security, user management, and permissions' }
};

export const Topbar: React.FC<TopbarProps> = ({ currentTab, onOpenMobile }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [attendance, setAttendance] = useState<any>(null);
  const [loadingPunch, setLoadingPunch] = useState(false);

  const fetchAttendanceStatus = async () => {
    try {
      const res = await attendanceApi.getMyStatus();
      if (res.success) {
        setAttendance(res.data);
      }
    } catch {
      // silently handle if employee profile not bound
    }
  };

  useEffect(() => {
    fetchAttendanceStatus();
  }, [user]);

  const handlePunchIn = async () => {
    try {
      setLoadingPunch(true);
      const res = await attendanceApi.checkIn();
      if (res.success) {
        toast.success(res.message || 'Checked in successfully!');
        await fetchAttendanceStatus();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to check in');
    } finally {
      setLoadingPunch(false);
    }
  };

  const handlePunchOut = async () => {
    try {
      setLoadingPunch(true);
      const res = await attendanceApi.checkOut();
      if (res.success) {
        toast.success(res.message || 'Checked out successfully!');
        await fetchAttendanceStatus();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to check out');
    } finally {
      setLoadingPunch(false);
    }
  };

  const tabInfo = TAB_TITLES[currentTab] || { title: 'Enterprise EMS', subtitle: 'Modern Workforce Platform' };

  const isCheckedIn = attendance?.checkIn;
  const isCheckedOut = attendance?.checkOut;

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: '#ffffff',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem',
        position: 'sticky',
        top: 0,
        zIndex: 30
      }}
    >
      {/* Title & Mobile Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onOpenMobile}
          className="btn-ghost"
          style={{
            padding: '0.5rem',
            borderRadius: 'var(--radius-md)',
            display: 'none',
            cursor: 'pointer'
          }}
          id="mobile-menu-btn"
        >
          <Menu size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {tabInfo.title}
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
            {tabInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Action Area: Punch Widget & User Pill */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {/* Punch widget for logged in employee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.375rem 0.75rem',
            backgroundColor: 'var(--slate-50)',
            border: '1px solid var(--slate-200)',
            borderRadius: 'var(--radius-full)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Clock size={16} color="var(--primary-600)" />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-700)' }}>
              {isCheckedOut ? (
                `Logged: ${attendance.workHours} hrs`
              ) : isCheckedIn ? (
                `In: ${new Date(attendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
              ) : (
                'Not Checked In'
              )}
            </span>
          </div>

          {!isCheckedIn ? (
            <button
              onClick={handlePunchIn}
              disabled={loadingPunch}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                gap: '0.3rem'
              }}
            >
              <LogIn size={13} />
              <span>Punch In</span>
            </button>
          ) : !isCheckedOut ? (
            <button
              onClick={handlePunchOut}
              disabled={loadingPunch}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.25rem 0.75rem',
                fontSize: '0.75rem',
                gap: '0.3rem',
                color: 'var(--danger-600)',
                borderColor: 'var(--danger-100)'
              }}
            >
              <LogOut size={13} />
              <span>Punch Out</span>
            </button>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--success-600)', fontSize: '0.75rem', fontWeight: 700 }}>
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>

        {/* Date Today Badge */}
        <div style={{ display: 'flex', fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', background: 'var(--slate-100)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
};
