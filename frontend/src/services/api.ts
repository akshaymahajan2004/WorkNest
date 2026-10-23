const BASE_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('ems_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // If unauthorized, clear token and redirect to login if not already on login
    if (!window.location.pathname.includes('/login')) {
      localStorage.removeItem('ems_token');
      localStorage.removeItem('ems_user');
      window.location.href = '/login';
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

export const api = {
  get: <T>(url: string) => request<T>(url, { method: 'GET' }),
  post: <T>(url: string, body?: any) => request<T>(url, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(url: string, body?: any) => request<T>(url, { method: 'PUT', body: JSON.stringify(body) }),
  del: <T>(url: string) => request<T>(url, { method: 'DELETE' })
};

// Module-specific APIs
export const authApi = {
  login: (credentials: { email: string; password: string }) => api.post<any>('/auth/login', credentials),
  demoLogin: (role: string) => api.post<any>('/auth/demo-login', { role }),
  me: () => api.get<any>('/auth/me')
};

export const dashboardApi = {
  getStats: () => api.get<any>('/dashboard/stats')
};

export const employeeApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/employees?${query}`);
  },
  getById: (id: string) => api.get<any>(`/employees/${id}`),
  create: (data: any) => api.post<any>('/employees', data),
  update: (id: string, data: any) => api.put<any>(`/employees/${id}`, data),
  delete: (id: string) => api.del<any>(`/employees/${id}`)
};

export const departmentApi = {
  getAll: () => api.get<any>('/departments'),
  getById: (id: string) => api.get<any>(`/departments/${id}`),
  create: (data: any) => api.post<any>('/departments', data),
  update: (id: string, data: any) => api.put<any>(`/departments/${id}`, data),
  delete: (id: string) => api.del<any>(`/departments/${id}`),
  assign: (id: string, employeeIds: string[]) => api.post<any>(`/departments/${id}/assign`, { employeeIds })
};

export const attendanceApi = {
  getRoster: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/attendance?${query}`);
  },
  getMyStatus: () => api.get<any>('/attendance/my-status'),
  checkIn: (employeeId?: string) => api.post<any>('/attendance/check-in', { employeeId }),
  checkOut: (employeeId?: string) => api.post<any>('/attendance/check-out', { employeeId }),
  mark: (data: any) => api.post<any>('/attendance/mark', data),
  getMonthlySummary: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/attendance/monthly-summary?${query}`);
  }
};

export const leaveApi = {
  getAll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/leaves?${query}`);
  },
  getBalances: (employeeId?: string) => {
    const query = employeeId ? `?employeeId=${employeeId}` : '';
    return api.get<any>(`/leaves/balances${query}`);
  },
  apply: (data: any) => api.post<any>('/leaves/apply', data),
  review: (id: string, data: { status: string; rejectionReason?: string }) =>
    api.put<any>(`/leaves/${id}/review`, data)
};

export const payrollApi = {
  getRecords: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/payroll/records?${query}`);
  },
  getStructures: () => api.get<any>('/payroll/structures'),
  updateStructure: (employeeId: string, data: any) =>
    api.put<any>(`/payroll/structures/${employeeId}`, data),
  generateBatch: (data: { month: number; year: number }) =>
    api.post<any>('/payroll/generate-batch', data),
  updateStatus: (id: string, data: { status: string; paymentDate?: string }) =>
    api.put<any>(`/payroll/records/${id}/status`, data),
  getPayslip: (id: string) => api.get<any>(`/payroll/payslip/${id}`)
};

export const reportApi = {
  getEmployees: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/reports/employees?${query}`);
  },
  getAttendance: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/reports/attendance?${query}`);
  },
  getLeaves: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/reports/leaves?${query}`);
  },
  getPayroll: (params?: Record<string, string>) => {
    const query = new URLSearchParams(params).toString();
    return api.get<any>(`/reports/payroll?${query}`);
  },
  getExportUrl: (type: 'employees' | 'attendance' | 'leaves' | 'payroll', params?: Record<string, string>) => {
    const allParams = { ...params, format: 'csv' };
    const query = new URLSearchParams(allParams).toString();
    return `/api/reports/${type}?${query}`;
  }
};

export const settingsApi = {
  getCompany: () => api.get<any>('/settings/company'),
  updateCompany: (data: any) => api.put<any>('/settings/company', data),
  getUsers: () => api.get<any>('/settings/users'),
  updateUser: (id: string, data: any) => api.put<any>(`/settings/users/${id}`, data),
  getAuditLogs: () => api.get<any>('/settings/audit-logs'),
  getPermissions: () => api.get<any>('/settings/permissions')
};
