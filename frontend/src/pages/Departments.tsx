import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { departmentApi, employeeApi } from '../services/api';
import { Department, Employee } from '../types';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/common/Modal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';

export const Departments: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [deptDetail, setDeptDetail] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    budget: 150000,
    headId: ''
  });

  const { toast } = useToast();
  const { role } = useAuth();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentApi.getAll();
      if (res.success) {
        setDepartments(res.data);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeesList = async () => {
    try {
      const res = await employeeApi.getAll({ limit: '100' });
      if (res.success) {
        setAllEmployees(res.data);
      }
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchEmployeesList();
  }, []);

  const openCreateModal = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      budget: 150000,
      headId: ''
    });
    setIsAddOpen(true);
  };

  const openEditModal = (dept: Department) => {
    setSelectedDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || '',
      budget: dept.budget || 0,
      headId: dept.headId || ''
    });
    setIsEditOpen(true);
  };

  const openMembersModal = async (dept: Department) => {
    setSelectedDept(dept);
    setIsMembersOpen(true);
    try {
      const res = await departmentApi.getById(dept.id);
      if (res.success) {
        setDeptDetail(res.data);
      }
    } catch (e: any) {
      toast.error('Failed to load department members');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await departmentApi.create(formData);
      if (res.success) {
        toast.success(`Department ${res.data.name} created!`);
        setIsAddOpen(false);
        fetchDepartments();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    try {
      setSubmitting(true);
      const res = await departmentApi.update(selectedDept.id, formData);
      if (res.success) {
        toast.success(`Department ${res.data.name} updated!`);
        setIsEditOpen(false);
        fetchDepartments();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedDept) return;
    try {
      setSubmitting(true);
      const res = await departmentApi.delete(selectedDept.id);
      if (res.success) {
        toast.success(res.message || 'Department deleted');
        setIsDeleteOpen(false);
        fetchDepartments();
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete department');
    } finally {
      setSubmitting(false);
    }
  };

  const totalBudget = departments.reduce((acc, d) => acc + (d.budget || 0), 0);
  const totalAssignedStaff = departments.reduce((acc, d) => acc + (d.employeeCount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Overview Metric Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          backgroundColor: '#ffffff'
        }}
      >
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Active Departments
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              {departments.length}
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Assigned Personnel
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary-700)' }}>
              {totalAssignedStaff} Employees
            </div>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
              Total Annual Allocation
            </span>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              ${totalBudget.toLocaleString()}
            </div>
          </div>
        </div>

        {(role === 'ADMIN' || role === 'HR') && (
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} />
            <span>Add Department</span>
          </button>
        )}
      </div>

      {/* Department Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--slate-500)' }}>Loading organizational units...</p>
          </div>
        ) : departments.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--slate-500)' }}>No departments established.</p>
          </div>
        ) : (
          departments.map(dept => (
            <div
              key={dept.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '1.5rem',
                position: 'relative'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--primary-50)',
                        color: 'var(--primary-600)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--slate-900)' }}>
                        {dept.name}
                      </h3>
                      <span className="badge badge-primary" style={{ fontSize: '0.6875rem' }}>
                        {dept.code}
                      </span>
                    </div>
                  </div>

                  {(role === 'ADMIN' || role === 'HR') && (
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm)' }}
                        title="Edit Department"
                        onClick={() => openEditModal(dept)}
                      >
                        <Edit2 size={15} color="var(--slate-500)" />
                      </button>
                      {role === 'ADMIN' && (
                        <button
                          className="btn-ghost"
                          style={{ padding: '0.25rem 0.4rem', borderRadius: 'var(--radius-sm)' }}
                          title="Delete Department"
                          onClick={() => {
                            setSelectedDept(dept);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <Trash2 size={15} color="var(--danger-500)" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <p style={{ fontSize: '0.8125rem', color: 'var(--slate-600)', marginBottom: '1.25rem', minHeight: '38px', lineHeight: 1.4 }}>
                  {dept.description || 'No description specified for this organizational division.'}
                </p>

                {/* Head of Department */}
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--slate-50)', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>
                    Department Head
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                    {dept.head ? (
                      <>
                        <img
                          src={dept.head.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=80'}
                          alt=""
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--slate-900)' }}>
                            {dept.head.firstName} {dept.head.lastName}
                          </div>
                          <div style={{ fontSize: '0.6875rem', color: 'var(--slate-500)' }}>
                            {dept.head.designation}
                          </div>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: '0.8125rem', color: 'var(--slate-500)' }}>No lead appointed</span>
                    )}
                  </div>
                </div>

                {/* Stats row: Headcount and Budget */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                  <div style={{ borderLeft: '3px solid var(--primary-500)', paddingLeft: '0.5rem' }}>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>Team Size</span>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{dept.employeeCount || 0} Staff</div>
                  </div>
                  <div style={{ borderLeft: '3px solid var(--success-500)', paddingLeft: '0.5rem' }}>
                    <span style={{ color: 'var(--slate-400)', fontSize: '0.75rem' }}>Budget</span>
                    <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>${(dept.budget || 0).toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* View Members Footer Button */}
              <button
                className="btn btn-secondary btn-sm"
                style={{ width: '100%', marginTop: '1.25rem', justifyContent: 'space-between' }}
                onClick={() => openMembersModal(dept)}
              >
                <span>View {dept.employeeCount || 0} Team Members</span>
                <ArrowRight size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Create Department Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Create New Department"
        maxWidth="550px"
      >
        <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Department Name *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. Platform Engineering"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Code *</label>
              <input
                type="text"
                className="input"
                required
                placeholder="e.g. ENG"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Outline the responsibilities of this department..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Operating Budget ($)</label>
              <input
                type="number"
                className="input"
                min="0"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Head of Department</label>
              <select
                className="select"
                value={formData.headId}
                onChange={e => setFormData({ ...formData, headId: e.target.value })}
              >
                <option value="">Select Appointed Head...</option>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Department Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title={`Edit Department: ${selectedDept?.name}`}
        maxWidth="550px"
      >
        <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Department Name</label>
              <input
                type="text"
                className="input"
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Code</label>
              <input
                type="text"
                className="input"
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="label">Description</label>
            <textarea
              className="textarea"
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Operating Budget ($)</label>
              <input
                type="number"
                className="input"
                value={formData.budget}
                onChange={e => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="label">Head of Department</label>
              <select
                className="select"
                value={formData.headId}
                onChange={e => setFormData({ ...formData, headId: e.target.value })}
              >
                <option value="">No head appointed</option>
                {allEmployees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName} ({emp.designation})
                  </option>
                ))}
              </select>
            </div>
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

      {/* View Department Members Modal */}
      <Modal
        isOpen={isMembersOpen}
        onClose={() => setIsMembersOpen(false)}
        title={`Members of ${selectedDept?.name} (${deptDetail?.employees?.length || 0})`}
        maxWidth="650px"
      >
        <div>
          {deptDetail?.employees && deptDetail.employees.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '50vh', overflowY: 'auto' }}>
              {deptDetail.employees.map((member: any) => (
                <div
                  key={member.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={member.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80'}
                      alt=""
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {member.firstName} {member.lastName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                        {member.designation} • {member.email}
                      </div>
                    </div>
                  </div>
                  <span className="badge badge-success">{member.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--slate-500)' }}>
              No employees currently assigned to this department.
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Department"
        message={`Are you sure you want to delete ${selectedDept?.name}? Departments with assigned employees cannot be removed until staff are reassigned.`}
        confirmLabel="Delete Department"
        variant="danger"
        isLoading={submitting}
      />
    </div>
  );
};
