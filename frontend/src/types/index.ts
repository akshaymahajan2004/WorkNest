export type Role = 'ADMIN' | 'HR' | 'EMPLOYEE';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN';
export type EmployeeStatus = 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'ABSENT';
export type LeaveType = 'CASUAL' | 'SICK' | 'ANNUAL' | 'MATERNITY' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type PayrollStatus = 'DRAFT' | 'PROCESSED' | 'PAID';

export interface User {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
    avatar: string | null;
    departmentId: string | null;
    department?: { name: string };
  } | null;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  budget: number;
  headId?: string | null;
  employeeCount?: number;
  head?: {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    email: string;
    designation: string;
  } | null;
  employees?: Employee[];
}

export interface SalaryStructure {
  id: string;
  employeeId: string;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medicalAllowance: number;
  specialAllowance: number;
  pfDeduction: number;
  taxDeduction: number;
  otherDeductions: number;
  netSalary: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  designation: string;
  departmentId?: string | null;
  department?: Department | null;
  joiningDate: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  userId?: string | null;
  salaryStructure?: SalaryStructure | null;
  leaveBalances?: LeaveBalance[];
  leaves?: Leave[];
  attendances?: Attendance[];
  payrollRecords?: PayrollRecord[];
}

export interface Attendance {
  id?: string;
  employeeId: string;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    designation: string;
    department?: { name: string };
  };
  date: string;
  checkIn?: string | null;
  checkOut?: string | null;
  workHours: number;
  status: AttendanceStatus;
  notes?: string | null;
}

export interface Leave {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    designation: string;
    department?: { name: string };
  };
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  reviewedBy?: string | null;
  rejectionReason?: string | null;
  appliedAt: string;
  reviewedAt?: string | null;
}

export interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  annualTotal: number;
  annualUsed: number;
  annualRemaining: number;
  sickTotal: number;
  sickUsed: number;
  sickRemaining: number;
  casualTotal: number;
  casualUsed: number;
  casualRemaining: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employee: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    designation: string;
    department?: { id: string; name: string; code: string };
  };
  month: number;
  year: number;
  basicSalary: number;
  totalAllowances: number;
  totalDeductions: number;
  netSalary: number;
  paymentStatus: PayrollStatus;
  paymentDate?: string | null;
  notes?: string | null;
}

export interface CompanySetting {
  id: string;
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  currency: string;
  timezone: string;
  workingHoursPerDay: number;
  leavePolicy: string;
}

export interface ActivityLog {
  id: string;
  actorId?: string;
  actorName: string;
  action: string;
  module: string;
  details?: string;
  createdAt: string;
}

export interface DashboardStats {
  summary: {
    totalEmployees: number;
    activeEmployees: number;
    onLeaveEmployees: number;
    presentToday: number;
    lateToday: number;
    absentToday: number;
    newHiresThisMonth: number;
    monthlyPayrollTotal: number;
  };
  departmentDistribution: Array<{
    id: string;
    name: string;
    code: string;
    count: number;
    percentage: number;
  }>;
  weeklyAttendance: Array<{
    date: string;
    day: string;
    present: number;
    late: number;
    absent: number;
  }>;
  recentHires: Employee[];
  pendingLeaves: Leave[];
}
