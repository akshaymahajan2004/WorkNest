import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  CalendarOff,
  DollarSign,
  UserPlus,
  Clock,
  ArrowUpRight,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { StatCard } from '../components/common/StatCard';
import { dashboardApi, leaveApi } from '../services/api';
import { DashboardStats } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { role } = useAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardApi.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReviewLeave = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await leaveApi.review(id, { status });
      if (res.success) {
        toast.success(res.message || `Leave ${status.toLowerCase()} successfully`);
        fetchStats();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update leave');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              border: '3px solid var(--slate-200)',
              borderTopColor: 'var(--primary-600)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}
          />
          <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>Loading Enterprise Analytics...</p>
        </div>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const summary = stats?.summary || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeaveEmployees: 0,
    presentToday: 0,
    lateToday: 0,
    absentToday: 0,
    newHiresThisMonth: 0,
    monthlyPayrollTotal: 0
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* KPI Stat Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <StatCard
          title="Total Workforce"
          value={summary.totalEmployees}
          subtitle={`${summary.activeEmployees} active accounts`}
          icon={<Users size={22} />}
          accentColor="var(--primary-600)"
          trend={{ value: `+${summary.newHiresThisMonth} this month`, isPositive: true }}
        />
        <StatCard
          title="Present Today"
          value={summary.presentToday}
          subtitle={`${summary.lateToday} late punch-ins`}
          icon={<CheckCircle size={22} />}
          accentColor="var(--success-600)"
        />
        <StatCard
          title="On Leave Today"
          value={summary.onLeaveEmployees}
          subtitle={`${summary.absentToday} unexcused absence`}
          icon={<CalendarOff size={22} />}
          accentColor="var(--warning-500)"
        />
        <StatCard
          title="Monthly Payroll"
          value={`$${summary.monthlyPayrollTotal.toLocaleString()}`}
          subtitle="Estimated net disbursement"
          icon={<DollarSign size={22} />}
          accentColor="var(--purple-600)"
        />
      </div>

      {/* Quick Action Ribbon */}
      <div
        className="card"
        style={{
          padding: '1rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(to right, rgba(37, 99, 235, 0.03), transparent)'
        }}
      >
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--slate-900)' }}>
            Operational Quick Actions
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Frequently accessed workforce shortcuts & administrative tools
          </p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.625rem' }}>
          {(role === 'ADMIN' || role === 'HR') && (
            <button className="btn btn-primary btn-sm" onClick={() => onNavigate('employees')}>
              <UserPlus size={15} />
              <span>Add Employee</span>
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('attendance')}>
            <Clock size={15} />
            <span>Attendance Log</span>
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('leaves')}>
            <CalendarOff size={15} />
            <span>Apply Leave</span>
          </button>
          {(role === 'ADMIN' || role === 'HR') && (
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('payroll')}>
              <DollarSign size={15} />
              <span>Run Payroll</span>
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('reports')}>
            <FileSpreadsheet size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Analytics Row: Department Distribution & Weekly Attendance Trends */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Department Distribution */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Department Distribution</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Headcount breakdown across organizational units
              </p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('departments')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {stats?.departmentDistribution && stats.departmentDistribution.length > 0 ? (
              stats.departmentDistribution.map((dept, i) => {
                const colors = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899'];
                const color = colors[i % colors.length];
                return (
                  <div key={dept.id}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--slate-700)' }}>
                        {dept.name} <span style={{ color: 'var(--slate-400)', fontWeight: 400 }}>({dept.code})</span>
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                        {dept.count} staff ({dept.percentage}%)
                      </span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--slate-100)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(4, dept.percentage)}%`,
                          backgroundColor: color,
                          borderRadius: 'var(--radius-full)',
                          transition: 'width 0.5s ease-out'
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p style={{ color: 'var(--slate-500)', fontSize: '0.875rem' }}>No departments found.</p>
            )}
          </div>
        </div>

        {/* Weekly Attendance Trends (Visual Chart) */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Attendance Trends (Last 7 Days)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Daily status metrics for present, late, and absent records
              </p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('attendance')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="card-body">
            {stats?.weeklyAttendance && stats.weeklyAttendance.length > 0 ? (
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '170px', gap: '0.75rem', paddingTop: '1rem' }}>
                {stats.weeklyAttendance.map((item, i) => {
                  const maxStaff = Math.max(summary.totalEmployees, 10);
                  const presentH = Math.min(100, Math.round((item.present / maxStaff) * 120));
                  const lateH = Math.min(60, Math.round((item.late / maxStaff) * 120));
                  const absentH = Math.min(40, Math.round((item.absent / maxStaff) * 120));

                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%', maxWidth: '28px', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'center' }}>
                        {absentH > 0 && (
                          <div
                            title={`Absent: ${item.absent}`}
                            style={{ width: '100%', height: `${absentH}px`, backgroundColor: 'var(--danger-500)', borderRadius: '3px' }}
                          />
                        )}
                        {lateH > 0 && (
                          <div
                            title={`Late: ${item.late}`}
                            style={{ width: '100%', height: `${lateH}px`, backgroundColor: 'var(--warning-500)', borderRadius: '3px' }}
                          />
                        )}
                        <div
                          title={`Present: ${item.present}`}
                          style={{
                            width: '100%',
                            height: `${Math.max(12, presentH)}px`,
                            backgroundColor: 'var(--primary-600)',
                            borderRadius: '3px'
                          }}
                        />
                      </div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-600)', marginTop: '0.5rem' }}>
                        {item.day}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--slate-500)' }}>No attendance trends available.</p>
            )}

            {/* Legend */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', marginTop: '1.25rem', paddingTop: '0.875rem', borderTop: '1px solid var(--border-subtle)', fontSize: '0.75rem', fontWeight: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--primary-600)', borderRadius: '2px' }} />
                <span>Present</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--warning-500)', borderRadius: '2px' }} />
                <span>Late</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: '10px', height: '10px', backgroundColor: 'var(--danger-500)', borderRadius: '2px' }} />
                <span>Absent</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row: Pending Leave Requests & Recent Hires */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Pending Leave Requests */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Pending Leave Requests</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Awaiting managerial review and approval
              </p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('leaves')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {stats?.pendingLeaves && stats.pendingLeaves.length > 0 ? (
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Type & Days</th>
                      <th>Dates</th>
                      {(role === 'ADMIN' || role === 'HR') && <th>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.pendingLeaves.map(leave => (
                      <tr key={leave.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                            <img
                              src={leave.employee.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                              alt=""
                              style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                                {leave.employee.firstName} {leave.employee.lastName}
                              </div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>
                                {leave.employee.department?.name || 'Staff'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{leave.leaveType}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginLeft: '0.375rem' }}>
                            ({leave.totalDays}d)
                          </span>
                        </td>
                        <td style={{ fontSize: '0.75rem', color: 'var(--slate-600)' }}>
                          {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} – {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        {(role === 'ADMIN' || role === 'HR') && (
                          <td>
                            <div style={{ display: 'flex', gap: '0.375rem' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                style={{ padding: '0.25rem 0.5rem', backgroundColor: 'var(--success-600)' }}
                                title="Approve"
                                onClick={() => handleReviewLeave(leave.id, 'APPROVED')}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.25rem 0.5rem', color: 'var(--danger-600)' }}
                                title="Reject"
                                onClick={() => handleReviewLeave(leave.id, 'REJECTED')}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.875rem' }}>
                <CheckCircle size={28} color="var(--success-500)" style={{ margin: '0 auto 0.5rem' }} />
                <p>All leave applications have been reviewed!</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Hires */}
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Recent Onboarding</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Latest team members welcomed to the enterprise
              </p>
            </div>
            <button className="btn-ghost btn-sm" onClick={() => onNavigate('employees')}>
              <ArrowUpRight size={16} />
            </button>
          </div>
          <div className="card-body" style={{ padding: '0.75rem 1.25rem' }}>
            {stats?.recentHires && stats.recentHires.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {stats.recentHires.map(emp => (
                  <div
                    key={emp.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.5rem 0',
                      borderBottom: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={emp.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
                        alt=""
                        style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-900)' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                          {emp.designation} • <span style={{ color: 'var(--primary-600)', fontWeight: 600 }}>{emp.department?.name || 'Dept'}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                        {emp.employeeCode}
                      </span>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)', marginTop: '2px' }}>
                        Joined {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--slate-500)' }}>No recent hires recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
