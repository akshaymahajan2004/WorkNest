import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Users,
  Clock,
  CalendarCheck,
  CreditCard,
  FileCheck,
  Building2
} from 'lucide-react';
import { reportApi, departmentApi } from '../services/api';
import { Department } from '../types';
import { useToast } from '../context/ToastContext';

export const ReportsPage: React.FC = () => {
  const [reportType, setReportType] = useState<'employees' | 'attendance' | 'leaves' | 'payroll'>('employees');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchDepartments = async () => {
    try {
      const res = await departmentApi.getAll();
      if (res.success) setDepartments(res.data);
    } catch {
      // silently handle
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (selectedDept !== 'ALL') params.departmentId = selectedDept;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      params.month = String(selectedMonth);
      params.year = String(selectedYear);

      let res;
      if (reportType === 'employees') res = await reportApi.getEmployees(params);
      else if (reportType === 'attendance') res = await reportApi.getAttendance(params);
      else if (reportType === 'leaves') res = await reportApi.getLeaves(params);
      else if (reportType === 'payroll') res = await reportApi.getPayroll(params);

      if (res && res.success) {
        setData(res.data);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate report preview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [reportType, selectedDept, selectedStatus, selectedMonth, selectedYear]);

  const handleExportCSV = () => {
    const params: Record<string, string> = {
      format: 'csv',
      month: String(selectedMonth),
      year: String(selectedYear)
    };
    if (selectedDept !== 'ALL') params.departmentId = selectedDept;
    if (selectedStatus !== 'ALL') params.status = selectedStatus;

    const exportUrl = reportApi.getExportUrl(reportType, params);
    toast.info(`Generating and downloading ${reportType} CSV...`);
    window.location.href = exportUrl;
  };

  const reportTabs = [
    { id: 'employees', label: 'Employee Directory', icon: Users },
    { id: 'attendance', label: 'Monthly Attendance', icon: Clock },
    { id: 'leaves', label: 'Leave Analytics', icon: CalendarCheck },
    { id: 'payroll', label: 'Payroll & Compensation', icon: CreditCard }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Category Tabs */}
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
        {reportTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = reportType === tab.id;
          return (
            <button
              key={tab.id}
              className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setReportType(tab.id as any)}
              style={{ flex: 1, minWidth: '170px', padding: '0.625rem 1rem' }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter and Download Header Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {reportType === 'employees' && (
            <>
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
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </>
          )}

          {(reportType === 'attendance' || reportType === 'payroll') && (
            <>
              <select
                className="select"
                style={{ width: 'auto' }}
                value={selectedMonth}
                onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
              >
                {[
                  { num: 1, name: 'Jan' }, { num: 2, name: 'Feb' }, { num: 3, name: 'Mar' },
                  { num: 4, name: 'Apr' }, { num: 5, name: 'May' }, { num: 6, name: 'Jun' },
                  { num: 7, name: 'Jul' }, { num: 8, name: 'Aug' }, { num: 9, name: 'Sep' },
                  { num: 10, name: 'Oct' }, { num: 11, name: 'Nov' }, { num: 12, name: 'Dec' }
                ].map(m => (
                  <option key={m.num} value={m.num}>{m.name}</option>
                ))}
              </select>

              <select
                className="select"
                style={{ width: 'auto' }}
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}

          {reportType === 'leaves' && (
            <select
              className="select"
              style={{ width: 'auto' }}
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="APPROVED">Approved Only</option>
              <option value="PENDING">Pending Only</option>
              <option value="REJECTED">Rejected Only</option>
            </select>
          )}

          <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)', fontWeight: 600 }}>
            {data.length} records populated
          </span>
        </div>

        <button className="btn btn-primary" onClick={handleExportCSV}>
          <Download size={16} />
          <span>Export CSV Spreadsheet</span>
        </button>
      </div>

      {/* Live Data Preview Table */}
      <div className="table-container">
        <table className="table">
          {reportType === 'employees' && (
            <>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Employee Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Designation</th>
                  <th>Status</th>
                  <th>Net Monthly Salary</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>Compiling records...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>No records found.</td></tr>
                ) : (
                  data.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{emp.employeeCode}</td>
                      <td style={{ fontWeight: 600 }}>{emp.firstName} {emp.lastName}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>{emp.email}</td>
                      <td><span className="badge badge-primary">{emp.department?.name || 'Unassigned'}</span></td>
                      <td>{emp.designation}</td>
                      <td><span className="badge badge-success">{emp.status}</span></td>
                      <td style={{ fontWeight: 700 }}>${(emp.salaryStructure?.netSalary || 0).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}

          {reportType === 'attendance' && (
            <>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Punch In</th>
                  <th>Punch Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>Compiling records...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>No attendance records for this period.</td></tr>
                ) : (
                  data.map(att => (
                    <tr key={att.id}>
                      <td style={{ fontWeight: 600 }}>{new Date(att.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                      <td style={{ fontWeight: 600 }}>{att.employee.firstName} {att.employee.lastName}</td>
                      <td><span className="badge badge-primary">{att.employee.department?.name || 'Dept'}</span></td>
                      <td>{att.checkIn ? new Date(att.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td>{att.checkOut ? new Date(att.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                      <td style={{ fontWeight: 700 }}>{att.workHours} hrs</td>
                      <td><span className={`badge ${att.status === 'PRESENT' ? 'badge-success' : 'badge-warning'}`}>{att.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}

          {reportType === 'leaves' && (
            <>
              <thead>
                <tr>
                  <th>Applicant</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Duration</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>Compiling records...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem' }}>No leave applications found.</td></tr>
                ) : (
                  data.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.employee.firstName} {l.employee.lastName}</td>
                      <td>{l.employee.department?.name || 'General'}</td>
                      <td><span className="badge badge-primary">{l.leaveType}</span></td>
                      <td style={{ fontWeight: 700 }}>{l.totalDays} Day(s)</td>
                      <td>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td><span className={`badge ${l.status === 'APPROVED' ? 'badge-success' : l.status === 'PENDING' ? 'badge-warning' : 'badge-danger'}`}>{l.status}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}

          {reportType === 'payroll' && (
            <>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Department</th>
                  <th>Period</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Disbursed</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>Compiling records...</td></tr>
                ) : data.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: '2.5rem' }}>No payroll data for this period.</td></tr>
                ) : (
                  data.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600 }}>{p.employee.firstName} {p.employee.lastName}</td>
                      <td>{p.employee.designation}</td>
                      <td>{p.employee.department?.name || 'Dept'}</td>
                      <td>{p.month}/{p.year}</td>
                      <td>${p.basicSalary.toLocaleString()}</td>
                      <td style={{ color: 'var(--success-600)' }}>+${p.totalAllowances.toLocaleString()}</td>
                      <td style={{ color: 'var(--danger-600)' }}>-${p.totalDeductions.toLocaleString()}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>${p.netSalary.toLocaleString()}</td>
                      <td><span className="badge badge-success">{p.paymentStatus}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </>
          )}
        </table>
      </div>
    </div>
  );
};
