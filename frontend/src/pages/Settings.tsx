import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  ShieldCheck,
  History,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Mail,
  Phone,
  Clock
} from 'lucide-react';
import { settingsApi } from '../services/api';
import { CompanySetting, ActivityLog, Role } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'company' | 'users' | 'permissions' | 'audit'>('company');
  const [company, setCompany] = useState<CompanySetting | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { toast } = useToast();
  const { role } = useAuth();

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const res = await settingsApi.getCompany();
      if (res.success) setCompany(res.data);
    } catch (e: any) {
      toast.error('Failed to load company profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (role !== 'ADMIN') return;
    try {
      const res = await settingsApi.getUsers();
      if (res.success) setUsers(res.data);
    } catch {
      // silently handle
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await settingsApi.getPermissions();
      if (res.success) setPermissions(res.data);
    } catch {
      // silently handle
    }
  };

  const fetchAuditLogs = async () => {
    if (role === 'EMPLOYEE') return;
    try {
      const res = await settingsApi.getAuditLogs();
      if (res.success) setAuditLogs(res.data);
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchCompany();
    fetchPermissions();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'audit') fetchAuditLogs();
  }, [activeTab]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    try {
      setSaving(true);
      const res = await settingsApi.updateCompany(company);
      if (res.success) {
        toast.success(res.message || 'Company profile saved successfully');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update company settings');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleUserActive = async (userItem: any) => {
    try {
      const newStatus = !userItem.isActive;
      const res = await settingsApi.updateUser(userItem.id, { isActive: newStatus });
      if (res.success) {
        toast.success(`User ${userItem.email} ${newStatus ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update user');
    }
  };

  const handleChangeUserRole = async (userId: string, newRole: Role) => {
    try {
      const res = await settingsApi.updateUser(userId, { role: newRole });
      if (res.success) {
        toast.success(`Role updated to ${newRole}`);
        fetchUsers();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update role');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Settings Navigation Tabs */}
      <div
        className="card"
        style={{
          padding: '0.75rem',
          display: 'flex',
          gap: '0.5rem',
          flexWrap: 'wrap',
          backgroundColor: '#ffffff'
        }}
      >
        <button
          className={`btn btn-sm ${activeTab === 'company' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('company')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <Building2 size={16} />
          <span>Company Profile</span>
        </button>

        {role === 'ADMIN' && (
          <button
            className={`btn btn-sm ${activeTab === 'users' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('users')}
            style={{ flex: 1, minWidth: '150px' }}
          >
            <Users size={16} />
            <span>User Accounts</span>
          </button>
        )}

        <button
          className={`btn btn-sm ${activeTab === 'permissions' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('permissions')}
          style={{ flex: 1, minWidth: '150px' }}
        >
          <ShieldCheck size={16} />
          <span>Role Permissions</span>
        </button>

        {role !== 'EMPLOYEE' && (
          <button
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('audit')}
            style={{ flex: 1, minWidth: '150px' }}
          >
            <History size={16} />
            <span>System Audit Logs</span>
          </button>
        )}
      </div>

      {/* Tab 1: Company Profile */}
      {activeTab === 'company' && company && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Enterprise Organization Details</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Corporate identity, official address, and payroll currency settings
              </p>
            </div>
            {role === 'ADMIN' && (
              <button
                type="submit"
                form="company-settings-form"
                className="btn btn-primary"
                disabled={saving}
              >
                <Save size={16} />
                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
          <div className="card-body">
            <form id="company-settings-form" onSubmit={handleSaveCompany} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Legal Company Name</label>
                  <input
                    type="text"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.companyName}
                    onChange={e => setCompany({ ...company, companyName: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Primary Contact Email</label>
                  <input
                    type="email"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.companyEmail}
                    onChange={e => setCompany({ ...company, companyEmail: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Official Phone</label>
                  <input
                    type="text"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.companyPhone}
                    onChange={e => setCompany({ ...company, companyPhone: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Headquarters Address</label>
                  <input
                    type="text"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.companyAddress}
                    onChange={e => setCompany({ ...company, companyAddress: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Currency Symbol</label>
                  <input
                    type="text"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.currency}
                    onChange={e => setCompany({ ...company, currency: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Timezone</label>
                  <input
                    type="text"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.timezone}
                    onChange={e => setCompany({ ...company, timezone: e.target.value })}
                  />
                </div>

                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="label">Working Hours Per Day</label>
                  <input
                    type="number"
                    step="0.5"
                    className="input"
                    disabled={role !== 'ADMIN'}
                    value={company.workingHoursPerDay}
                    onChange={e => setCompany({ ...company, workingHoursPerDay: parseFloat(e.target.value) || 8 })}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="label">Corporate Leave Policy Description</label>
                <textarea
                  className="textarea"
                  rows={3}
                  disabled={role !== 'ADMIN'}
                  value={company.leavePolicy}
                  onChange={e => setCompany({ ...company, leavePolicy: e.target.value })}
                />
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tab 2: User Accounts Management (ADMIN only) */}
      {activeTab === 'users' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">User Accounts & Access Control</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Manage authentication profiles, roles, and login access
              </p>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User / Associated Employee</th>
                  <th>Login Email</th>
                  <th>Role Assignment</th>
                  <th>Account Status</th>
                  <th>Created At</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                        <img
                          src={u.employee?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                          alt=""
                          style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {u.employee ? `${u.employee.firstName} ${u.employee.lastName}` : 'System Account'}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>
                            {u.employee?.designation || 'Administrator'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem' }}>{u.email}</td>
                    <td>
                      <select
                        className="select"
                        style={{ width: 'auto', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        value={u.role}
                        onChange={e => handleChangeUserRole(u.id, e.target.value as Role)}
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="HR">HR</option>
                        <option value="EMPLOYEE">EMPLOYEE</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {u.isActive ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-primary'}`}
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => handleToggleUserActive(u)}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Permissions Matrix */}
      {activeTab === 'permissions' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Role-Based Access Control (RBAC) Matrix</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                System capability and authorization definitions by user role
              </p>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Platform Feature / Module</th>
                  <th>Administrator</th>
                  <th>HR Manager</th>
                  <th>Staff / Employee</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((p, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600 }}>{p.module}</td>
                    <td>
                      <span className="badge badge-primary">
                        {typeof p.admin === 'boolean' ? (p.admin ? 'Granted' : 'Denied') : p.admin}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.hr ? 'badge-success' : 'badge-slate'}`}>
                        {typeof p.hr === 'boolean' ? (p.hr ? 'Granted' : 'Denied') : p.hr}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${p.employee ? 'badge-slate' : 'badge-danger'}`}>
                        {typeof p.employee === 'boolean' ? (p.employee ? 'Granted' : 'Restricted') : p.employee}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: System Audit Logs */}
      {activeTab === 'audit' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Security & Administrative Audit Logs</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                Real-time activity trail of critical system actions
              </p>
            </div>
          </div>
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Actor</th>
                  <th>Module</th>
                  <th>Action</th>
                  <th>Event Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.75rem', color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600, fontSize: '0.8125rem' }}>{log.actorName}</td>
                    <td><span className="badge badge-primary">{log.module}</span></td>
                    <td style={{ fontWeight: 600 }}>{log.action}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>{log.details || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
