import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  Clock,
  Briefcase
} from 'lucide-react';
import { employeeApi, departmentApi } from '../services/api';
import { Employee, Department, EmployeeStatus, EmploymentType } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pageSize: 10, totalPages: 1 });

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [detailData, setDetailData] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    designation: '',
    departmentId: '',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: new Date().toISOString().split('T')[0],
    basicSalary: 5000,
    password: 'Emp@123',
    gender: 'Male',
    address: ''
  });

  const { toast } = useToast();
  const { role } = useAuth();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {
        page: String(page),
        limit: '10'
      };
      if (search) params.search = search;
      if (selectedDept !== 'ALL') params.departmentId = selectedDept;
      if (selectedStatus !== 'ALL') params.status = selectedStatus;
      if (selectedType !== 'ALL') params.employmentType = selectedType;

      const res = await employeeApi.getAll(params);
      if (res.success) {
        setEmployees(res.data);
        setPagination(res.pagination);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch employees');
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
    fetchEmployees();
  }, [page, selectedDept, selectedStatus, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchEmployees();
  };

  const openViewModal = async (emp: Employee) => {
    setSelectedEmployee(emp);
    setIsViewOpen(true);
    try {
      const res = await employeeApi.getById(emp.id);
      if (res.success) {
        setDetailData(res.data);
      }
    } catch (e: any) {
      toast.error('Failed to load full profile details');
    }
  };

  const openEditModal = (emp: Employee) => {
    setSelectedEmployee(emp);
    setFormData({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || '',
      designation: emp.designation,
      departmentId: emp.departmentId || '',
      employmentType: emp.employmentType,
      status: emp.status,
      joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : '',
      basicSalary: emp.salaryStructure?.basicSalary || 5000,
      password: '',
      gender: emp.gender || 'Male',
      address: emp.address || ''
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await employeeApi.create(formData);
      if (res.success) {
        toast.success(`Employee ${res.data.firstName} ${res.data.lastName} created!`);
        setIsAddOpen(false);
        fetchEmployees();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return;
    try {
      setSubmitting(true);
      const res = await employeeApi.update(selectedEmployee.id, formData);
      if (res.success) {
        toast.success(`Employee ${res.data.firstName} updated!`);
        setIsEditOpen(false);
        fetchEmployees();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEmployee) return;
    try {
      setSubmitting(true);
      const res = await employeeApi.delete(selectedEmployee.id);
      if (res.success) {
        toast.success(res.message || 'Employee removed successfully');
        setIsDeleteOpen(false);
        fetchEmployees();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Search and Filters Bar */}
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
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '0.5rem', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="text"
              className="input"
              placeholder="Search by name, ID code, designation, or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft: '2.375rem' }}
            />
            <Search
              size={18}
              color="var(--slate-400)"
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>

        {/* Filter Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.75rem' }}>
          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedDept}
            onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
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
            onChange={e => { setSelectedStatus(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="TERMINATED">Terminated</option>
          </select>

          <select
            className="select"
            style={{ width: 'auto' }}
            value={selectedType}
            onChange={e => { setSelectedType(e.target.value); setPage(1); }}
          >
            <option value="ALL">All Types</option>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
            <option value="INTERN">Intern</option>
          </select>

          {(role === 'ADMIN' || role === 'HR') && (
            <button
              className="btn btn-primary"
              onClick={() => {
                setFormData({
                  firstName: '',
                  lastName: '',
                  email: '',
                  phone: '',
                  designation: '',
                  departmentId: departments[0]?.id || '',
                  employmentType: 'FULL_TIME',
                  status: 'ACTIVE',
                  joiningDate: new Date().toISOString().split('T')[0],
                  basicSalary: 5000,
                  password: 'Emp@123',
                  gender: 'Male',
                  address: ''
                });
                setIsAddOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Employees Directory Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Designation</th>
              <th>Department</th>
              <th>Type</th>
              <th>Status</th>
              <th>Joining Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--slate-500)' }}>Loading workforce directory...</p>
                </td>
              </tr>
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: 'var(--slate-500)', fontSize: '0.9375rem' }}>No employees found matching the filter criteria.</p>
                </td>
              </tr>
            ) : (
              employees.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={emp.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${emp.firstName}%20${emp.lastName}`}
                        alt=""
                        style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-full)', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>
                          {emp.firstName} {emp.lastName}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--slate-400)', fontFamily: 'var(--font-mono)' }}>
                          {emp.employeeCode} • {emp.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontWeight: 500 }}>{emp.designation}</td>
                  <td>
                    {emp.department ? (
                      <span className="badge badge-primary">{emp.department.name}</span>
                    ) : (
                      <span style={{ color: 'var(--slate-400)' }}>Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--slate-600)' }}>
                      {emp.employmentType.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        emp.status === 'ACTIVE' ? 'badge-success' :
                        emp.status === 'ON_LEAVE' ? 'badge-warning' : 'badge-danger'
                      }`}
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--slate-600)' }}>
                    {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.375rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.35rem 0.5rem' }}
                        title="View Full Profile"
                        onClick={() => openViewModal(emp)}
                      >
                        <Eye size={15} />
                      </button>
                      {(role === 'ADMIN' || role === 'HR') && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem' }}
                          title="Edit Details"
                          onClick={() => openEditModal(emp)}
                        >
                          <Edit2 size={15} />
                        </button>
                      )}
                      {role === 'ADMIN' && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.35rem 0.5rem', color: 'var(--danger-600)' }}
                          title="Delete Employee"
                          onClick={() => {
                            setSelectedEmployee(emp);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <Pagination
          currentPage={page}
          totalPages={pagination.totalPages}
          totalItems={pagination.total}
          pageSize={pagination.pageSize}
          onPageChange={setPage}
        />
      </div>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Add New Employee"
        maxWidth="680px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">First Name *</label>
              <input
                type="text"
                className="input"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Last Name *</label>
              <input
                type="text"
                className="input"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Work Email *</label>
              <input
                type="email"
                className="input"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Designation / Job Title *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Lead Systems Architect"
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Department</label>
              <select
                className="select"
                value={formData.departmentId}
                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Employment Type</label>
              <select
                className="select"
                value={formData.employmentType}
                onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Initial Status</label>
              <select
                className="select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Joining Date</label>
              <input
                type="date"
                className="input"
                value={formData.joiningDate}
                onChange={e => setFormData({ ...formData, joiningDate: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Monthly Base Salary ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={formData.basicSalary}
                onChange={e => setFormData({ ...formData, basicSalary: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Login Password</label>
              <input
                type="text"
                className="input"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Residential Address</label>
            <input
              type="text"
              className="input"
              placeholder="Street, City, State, ZIP"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Employee Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Employee: ${selectedEmployee?.firstName} ${selectedEmployee?.lastName}`}
        maxWidth="650px"
      >
        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">First Name</label>
              <input
                type="text"
                className="input"
                required
                value={formData.firstName}
                onChange={e => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Last Name</label>
              <input
                type="text"
                className="input"
                required
                value={formData.lastName}
                onChange={e => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Work Email</label>
              <input
                type="email"
                className="input"
                required
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Designation</label>
              <input
                type="text"
                className="input"
                required
                value={formData.designation}
                onChange={e => setFormData({ ...formData, designation: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Department</label>
              <select
                className="select"
                value={formData.departmentId}
                onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Select Department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Employment Status</label>
              <select
                className="select"
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="ON_LEAVE">ON LEAVE</option>
                <option value="TERMINATED">TERMINATED</option>
              </select>
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Employment Type</label>
              <select
                className="select"
                value={formData.employmentType}
                onChange={e => setFormData({ ...formData, employmentType: e.target.value })}
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="INTERN">Intern</option>
              </select>
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Address</label>
            <input
              type="text"
              className="input"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsEditOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Detailed Employee Profile Modal */}
      <Modal
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        title="Comprehensive Employee Profile"
        maxWidth="750px"
      >
        {selectedEmployee && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header Identity Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.25rem',
                padding: '1.25rem',
                backgroundColor: 'var(--slate-50)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <img
                src={selectedEmployee.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120'}
                alt=""
                style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #ffffff' }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--slate-900)' }}>
                    {selectedEmployee.firstName} {selectedEmployee.lastName}
                  </h3>
                  <span className="badge badge-success">{selectedEmployee.status}</span>
                </div>
                <p style={{ color: 'var(--slate-600)', fontSize: '0.875rem', fontWeight: 600 }}>
                  {selectedEmployee.designation} • <span style={{ color: 'var(--primary-600)' }}>{detailData?.department?.name || selectedEmployee.department?.name || 'Unassigned'}</span>
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.375rem', fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                  <span>ID: <strong style={{ color: 'var(--slate-700)' }}>{selectedEmployee.employeeCode}</strong></span>
                  <span>Joined: <strong style={{ color: 'var(--slate-700)' }}>{new Date(selectedEmployee.joiningDate).toLocaleDateString()}</strong></span>
                  <span>Type: <strong style={{ color: 'var(--slate-700)' }}>{selectedEmployee.employmentType}</strong></span>
                </div>
              </div>
            </div>

            {/* Quick Details Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Contact Details</span>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.375rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={14} color="var(--primary-600)" />
                    <span>{selectedEmployee.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={14} color="var(--primary-600)" />
                    <span>{selectedEmployee.phone || 'Not provided'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Briefcase size={14} color="var(--primary-600)" />
                    <span>{selectedEmployee.address || 'San Francisco, CA'}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: '#ffffff', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Compensation Overview</span>
                <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.8125rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Basic Salary:</span>
                    <strong>${(detailData?.salaryStructure?.basicSalary || 5000).toLocaleString()}/mo</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Total Allowances:</span>
                    <strong style={{ color: 'var(--success-600)' }}>+${((detailData?.salaryStructure?.hra || 0) + (detailData?.salaryStructure?.conveyance || 0) + (detailData?.salaryStructure?.medicalAllowance || 0)).toLocaleString()}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--slate-500)' }}>Net Disbursed:</span>
                    <strong style={{ color: 'var(--primary-700)' }}>${(detailData?.salaryStructure?.netSalary || 6000).toLocaleString()}/mo</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Leave Balances */}
            {detailData?.leaveBalances && detailData.leaveBalances.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '0.5rem' }}>
                  Annual Leave Balances ({new Date().getFullYear()})
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--primary-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>Annual Leave</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                      {detailData.leaveBalances[0].annualTotal - detailData.leaveBalances[0].annualUsed} / {detailData.leaveBalances[0].annualTotal}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--warning-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--warning-700)', fontWeight: 600 }}>Sick Leave</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning-800)' }}>
                      {detailData.leaveBalances[0].sickTotal - detailData.leaveBalances[0].sickUsed} / {detailData.leaveBalances[0].sickTotal}
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem', backgroundColor: 'var(--success-50)', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--success-700)', fontWeight: 600 }}>Casual Leave</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-800)' }}>
                      {detailData.leaveBalances[0].casualTotal - detailData.leaveBalances[0].casualUsed} / {detailData.leaveBalances[0].casualTotal}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Employee Record"
        message={`Are you sure you want to permanently remove ${selectedEmployee?.firstName} ${selectedEmployee?.lastName} (${selectedEmployee?.employeeCode})? This action will remove associated attendance, leaves, and payroll records.`}
        confirmLabel="Delete Employee"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
};
