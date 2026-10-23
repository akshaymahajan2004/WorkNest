import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  TrendingUp,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  Edit2,
  RefreshCw,
  Building,
  User,
  Calendar
} from 'lucide-react';
import { payrollApi } from '../services/api';
import { PayrollRecord, SalaryStructure, PayrollStatus } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';

export const PayrollPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'structures'>('records');
  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [summary, setSummary] = useState<any>({ totalPayroll: 0, totalAllowances: 0, totalDeductions: 0, count: 0 });
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [loading, setLoading] = useState(true);

  // Payslip Modal
  const [isPayslipOpen, setIsPayslipOpen] = useState(false);
  const [payslipData, setPayslipData] = useState<any>(null);

  // Edit Structure Modal
  const [isEditStructureOpen, setIsEditStructureOpen] = useState(false);
  const [structureForm, setStructureForm] = useState({
    employeeId: '',
    employeeName: '',
    basicSalary: 5000,
    hra: 2000,
    conveyance: 400,
    medicalAllowance: 300,
    specialAllowance: 1000,
    pfDeduction: 600,
    taxDeduction: 800,
    otherDeductions: 100
  });

  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { role } = useAuth();

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.getRecords({
        month: String(selectedMonth),
        year: String(selectedYear)
      });
      if (res.success) {
        setRecords(res.data);
        if (res.summary) setSummary(res.summary);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch payroll records');
    } finally {
      setLoading(false);
    }
  };

  const fetchStructures = async () => {
    if (role === 'EMPLOYEE') return;
    try {
      const res = await payrollApi.getStructures();
      if (res.success) {
        setStructures(res.data);
      }
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    if (activeTab === 'structures') {
      fetchStructures();
    }
  }, [activeTab]);

  const handleGenerateBatch = async () => {
    try {
      setSubmitting(true);
      const res = await payrollApi.generateBatch({
        month: selectedMonth,
        year: selectedYear
      });
      if (res.success) {
        toast.success(res.message || 'Batch payroll generated successfully');
        fetchRecords();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to generate batch payroll');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: PayrollStatus) => {
    try {
      const res = await payrollApi.updateStatus(id, {
        status: newStatus,
        paymentDate: newStatus === 'PAID' ? new Date().toISOString() : undefined
      });
      if (res.success) {
        toast.success(`Disbursement status updated to ${newStatus}`);
        fetchRecords();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update payment status');
    }
  };

  const openPayslip = async (id: string) => {
    try {
      const res = await payrollApi.getPayslip(id);
      if (res.success) {
        setPayslipData(res.data);
        setIsPayslipOpen(true);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to retrieve payslip');
    }
  };

  const openEditStructure = (struct: any) => {
    setStructureForm({
      employeeId: struct.employeeId,
      employeeName: `${struct.employee.firstName} ${struct.employee.lastName}`,
      basicSalary: struct.basicSalary,
      hra: struct.hra,
      conveyance: struct.conveyance,
      medicalAllowance: struct.medicalAllowance,
      specialAllowance: struct.specialAllowance,
      pfDeduction: struct.pfDeduction,
      taxDeduction: struct.taxDeduction,
      otherDeductions: struct.otherDeductions
    });
    setIsEditStructureOpen(true);
  };

  const handleSaveStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await payrollApi.updateStructure(structureForm.employeeId, structureForm);
      if (res.success) {
        toast.success(res.message || 'Salary structure updated successfully');
        setIsEditStructureOpen(false);
        fetchStructures();
        fetchRecords();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update structure');
    } finally {
      setSubmitting(false);
    }
  };

  const months = [
    { num: 1, name: 'January' }, { num: 2, name: 'February' }, { num: 3, name: 'March' },
    { num: 4, name: 'April' }, { num: 5, name: 'May' }, { num: 6, name: 'June' },
    { num: 7, name: 'July' }, { num: 8, name: 'August' }, { num: 9, name: 'September' },
    { num: 10, name: 'October' }, { num: 11, name: 'November' }, { num: 12, name: 'December' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Month Selector & Action Controls */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} color="var(--primary-600)" />
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--slate-700)' }}>Pay Period:</span>
          </div>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedMonth}
            onChange={e => setSelectedMonth(parseInt(e.target.value, 10))}
          >
            {months.map(m => (
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
        </div>

        {(role === 'ADMIN' || role === 'HR') && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn-primary"
              onClick={handleGenerateBatch}
              disabled={submitting}
            >
              <RefreshCw size={15} className={submitting ? 'animate-spin' : ''} />
              <span>Generate / Refresh Payroll</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--purple-600)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Net Disbursement
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            ${summary.totalPayroll.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            For {summary.count} staff members
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--success-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Allowances
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            +${summary.totalAllowances.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            HRA, Conveyance, Medical, Special
          </span>
        </div>

        <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid var(--danger-500)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Deductions
          </span>
          <div style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--danger-700)', marginTop: '0.25rem' }}>
            -${summary.totalDeductions.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
            Provident Fund, Withholding Tax
          </span>
        </div>
      </div>

      {/* Tabs & Table */}
      <div className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className={`btn btn-sm ${activeTab === 'records' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('records')}
            >
              <span>Monthly Records ({records.length})</span>
            </button>
            {(role === 'ADMIN' || role === 'HR') && (
              <button
                className={`btn btn-sm ${activeTab === 'structures' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setActiveTab('structures')}
              >
                <span>Salary Structures</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab 1: Monthly Records */}
        {activeTab === 'records' ? (
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>Allowances</th>
                  <th>Deductions</th>
                  <th>Net Payable</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--slate-500)' }}>Loading payroll records...</p>
                    </td>
                  </tr>
                ) : records.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3rem' }}>
                      <p style={{ color: 'var(--slate-500)' }}>
                        No payroll records found for {months.find(m => m.num === selectedMonth)?.name} {selectedYear}.
                        {(role === 'ADMIN' || role === 'HR') && ' Click "Generate / Refresh Payroll" above to create them.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  records.map(rec => (
                    <tr key={rec.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                          <img
                            src={rec.employee.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                            alt=""
                            style={{ width: '34px', height: '34px', borderRadius: '50%', objectFit: 'cover' }}
                          />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.8125rem' }}>
                              {rec.employee.firstName} {rec.employee.lastName}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                              {rec.employee.employeeCode}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{rec.employee.designation}</td>
                      <td style={{ fontWeight: 600 }}>${rec.basicSalary.toLocaleString()}</td>
                      <td style={{ color: 'var(--success-600)', fontWeight: 600 }}>
                        +${rec.totalAllowances.toLocaleString()}
                      </td>
                      <td style={{ color: 'var(--danger-600)', fontWeight: 600 }}>
                        -${rec.totalDeductions.toLocaleString()}
                      </td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-700)', fontSize: '0.9375rem' }}>
                        ${rec.netSalary.toLocaleString()}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            rec.paymentStatus === 'PAID' ? 'badge-success' :
                            rec.paymentStatus === 'PROCESSED' ? 'badge-warning' : 'badge-slate'
                          }`}
                        >
                          {rec.paymentStatus}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.375rem', alignItems: 'center' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '0.3rem 0.6rem' }}
                            onClick={() => openPayslip(rec.id)}
                            title="View Itemized Payslip"
                          >
                            <FileText size={14} />
                            <span>Payslip</span>
                          </button>

                          {(role === 'ADMIN' || role === 'HR') && rec.paymentStatus !== 'PAID' && (
                            <button
                              className="btn btn-primary btn-sm"
                              style={{ padding: '0.3rem 0.6rem', backgroundColor: rec.paymentStatus === 'DRAFT' ? 'var(--warning-500)' : 'var(--success-600)' }}
                              onClick={() => handleUpdateStatus(rec.id, rec.paymentStatus === 'DRAFT' ? 'PROCESSED' : 'PAID')}
                            >
                              <span>{rec.paymentStatus === 'DRAFT' ? 'Process' : 'Mark Paid'}</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tab 2: Salary Structures */
          <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Designation</th>
                  <th>Basic Salary</th>
                  <th>HRA</th>
                  <th>Conveyance</th>
                  <th>Medical</th>
                  <th>PF Deduction</th>
                  <th>Net Monthly</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s: any) => (
                  <tr key={s.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {s.employee.firstName} {s.employee.lastName}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--slate-400)' }}>
                        {s.employee.employeeCode}
                      </div>
                    </td>
                    <td>{s.employee.designation}</td>
                    <td style={{ fontWeight: 600 }}>${s.basicSalary.toLocaleString()}</td>
                    <td>${s.hra.toLocaleString()}</td>
                    <td>${s.conveyance.toLocaleString()}</td>
                    <td>${s.medicalAllowance.toLocaleString()}</td>
                    <td style={{ color: 'var(--danger-600)' }}>-${s.pfDeduction.toLocaleString()}</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary-700)' }}>
                      ${s.netSalary.toLocaleString()}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditStructure(s)}
                      >
                        <Edit2 size={14} />
                        <span>Edit Structure</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Itemized Payslip Modal */}
      <Modal
        isOpen={isPayslipOpen}
        onClose={() => setIsPayslipOpen(false)}
        title="Official Earnings Statement / Payslip"
        maxWidth="680px"
        footer={
          <button
            className="btn btn-primary"
            onClick={() => window.print()}
          >
            <Printer size={16} />
            <span>Print / Save as PDF</span>
          </button>
        }
      >
        {payslipData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} id="printable-payslip">
            {/* Payslip Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-subtle)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                  {payslipData.company?.companyName || 'Nexus Global Enterprises'}
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)', marginTop: '2px' }}>
                  {payslipData.company?.companyAddress || '500 Silicon Vista Way, San Francisco, CA'}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  {payslipData.company?.companyEmail} • {payslipData.company?.companyPhone}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="badge badge-primary" style={{ fontSize: '0.8125rem' }}>
                  PAYSLIP
                </span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '0.375rem' }}>
                  {months.find(m => m.num === payslipData.payroll.month)?.name} {payslipData.payroll.year}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>
                  Status: <strong style={{ color: 'var(--success-600)' }}>{payslipData.payroll.paymentStatus}</strong>
                </div>
              </div>
            </div>

            {/* Employee Metadata Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', backgroundColor: 'var(--slate-50)', padding: '1rem', borderRadius: 'var(--radius-md)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Employee Name:</span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                  {payslipData.employee.firstName} {payslipData.employee.lastName}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Designation:</span>
                <div style={{ fontSize: '0.8125rem' }}>{payslipData.employee.designation}</div>
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Employee ID:</span>
                <div style={{ fontWeight: 700, fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                  {payslipData.employee.employeeCode}
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--slate-400)' }}>Department:</span>
                <div style={{ fontSize: '0.8125rem' }}>{payslipData.employee.department?.name || 'Operations'}</div>
              </div>
            </div>

            {/* Earnings & Deductions Breakdown Columns */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Earnings */}
              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-900)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  Earnings (Allowances)
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Basic Salary:</span>
                    <strong>${payslipData.payroll.basicSalary.toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>House Rent Allowance (HRA):</span>
                    <strong>${(payslipData.salaryStructure?.hra || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Conveyance Allowance:</span>
                    <strong>${(payslipData.salaryStructure?.conveyance || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Medical Allowance:</span>
                    <strong>${(payslipData.salaryStructure?.medicalAllowance || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Special Allowance:</span>
                    <strong>${(payslipData.salaryStructure?.specialAllowance || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontWeight: 700 }}>
                    <span>Total Gross Earnings:</span>
                    <strong style={{ color: 'var(--success-600)' }}>
                      +${(payslipData.payroll.basicSalary + payslipData.payroll.totalAllowances).toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--slate-900)', textTransform: 'uppercase', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', marginBottom: '0.75rem' }}>
                  Deductions
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Provident Fund (PF):</span>
                    <strong>${(payslipData.salaryStructure?.pfDeduction || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Income Tax (TDS):</span>
                    <strong>${(payslipData.salaryStructure?.taxDeduction || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Other Deductions:</span>
                    <strong>${(payslipData.salaryStructure?.otherDeductions || 0).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.5rem', fontWeight: 700, marginTop: '2.5rem' }}>
                    <span>Total Deductions:</span>
                    <strong style={{ color: 'var(--danger-600)' }}>
                      -${payslipData.payroll.totalDeductions.toLocaleString()}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight Callout */}
            <div style={{ backgroundColor: 'var(--primary-50)', padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--primary-200)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-700)', textTransform: 'uppercase' }}>
                  Net Disbursed Compensation
                </span>
                <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  Transferred via electronic direct deposit
                </div>
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                ${payslipData.payroll.netSalary.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Salary Structure Modal */}
      <Modal
        isOpen={isEditStructureOpen}
        onClose={() => setIsEditStructureOpen(false)}
        title={`Configure Salary Structure: ${structureForm.employeeName}`}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveStructure} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Monthly Base Salary ($) *</label>
            <input
              type="number"
              className="input"
              required
              min="0"
              value={structureForm.basicSalary}
              onChange={e => setStructureForm({ ...structureForm, basicSalary: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">HRA Allowance ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.hra}
                onChange={e => setStructureForm({ ...structureForm, hra: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Conveyance Allowance ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.conveyance}
                onChange={e => setStructureForm({ ...structureForm, conveyance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Medical Allowance ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.medicalAllowance}
                onChange={e => setStructureForm({ ...structureForm, medicalAllowance: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Special Allowance ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.specialAllowance}
                onChange={e => setStructureForm({ ...structureForm, specialAllowance: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Provident Fund (PF) Deduction ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.pfDeduction}
                onChange={e => setStructureForm({ ...structureForm, pfDeduction: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Income Tax Deduction ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={structureForm.taxDeduction}
                onChange={e => setStructureForm({ ...structureForm, taxDeduction: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditStructureOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Structure'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
