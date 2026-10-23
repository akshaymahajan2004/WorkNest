import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// Helper to escape CSV values
const toCSV = (rows: any[][]): string => {
  return rows
    .map(row =>
      row
        .map(val => {
          if (val === null || val === undefined) return '""';
          const str = String(val).replace(/"/g, '""');
          return `"${str}"`;
        })
        .join(',')
    )
    .join('\r\n');
};

// GET /api/reports/employees
router.get('/employees', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { departmentId, status, format } = req.query;

    const where: any = {};
    if (departmentId && departmentId !== 'ALL') where.departmentId = String(departmentId);
    if (status && status !== 'ALL') where.status = status;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        salaryStructure: true
      },
      orderBy: { employeeCode: 'asc' }
    });

    if (format === 'csv') {
      const header = ['Employee Code', 'First Name', 'Last Name', 'Email', 'Phone', 'Department', 'Designation', 'Status', 'Employment Type', 'Joining Date', 'Net Salary'];
      const dataRows = employees.map(e => [
        e.employeeCode,
        e.firstName,
        e.lastName,
        e.email,
        e.phone || '',
        e.department?.name || 'Unassigned',
        e.designation,
        e.status,
        e.employmentType,
        e.joiningDate.toISOString().split('T')[0],
        e.salaryStructure?.netSalary || 0
      ]);

      const csvContent = toCSV([header, ...dataRows]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employee_directory_report.csv"');
      res.status(200).send(csvContent);
      return;
    }

    res.json({ success: true, data: employees, count: employees.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/attendance
router.get('/attendance', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, format } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const attendances = await prisma.attendance.findMany({
      where: {
        date: { gte: startOfMonth, lte: endOfMonth }
      },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: [{ date: 'desc' }, { employee: { firstName: 'asc' } }]
    });

    if (format === 'csv') {
      const header = ['Date', 'Employee Code', 'Employee Name', 'Department', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Notes'];
      const dataRows = attendances.map(a => [
        a.date.toISOString().split('T')[0],
        a.employee.employeeCode,
        `${a.employee.firstName} ${a.employee.lastName}`,
        a.employee.department?.name || '',
        a.checkIn ? a.checkIn.toLocaleTimeString() : '',
        a.checkOut ? a.checkOut.toLocaleTimeString() : '',
        a.workHours,
        a.status,
        a.notes || ''
      ]);

      const csvContent = toCSV([header, ...dataRows]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${targetMonth}_${targetYear}.csv"`);
      res.status(200).send(csvContent);
      return;
    }

    res.json({ success: true, data: attendances, count: attendances.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/leaves
router.get('/leaves', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, format } = req.query;
    const where: any = {};
    if (status && status !== 'ALL') where.status = status;

    const leaves = await prisma.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    if (format === 'csv') {
      const header = ['Application ID', 'Employee Code', 'Employee Name', 'Department', 'Leave Type', 'Start Date', 'End Date', 'Days', 'Status', 'Reason', 'Reviewed By'];
      const dataRows = leaves.map(l => [
        l.id,
        l.employee.employeeCode,
        `${l.employee.firstName} ${l.employee.lastName}`,
        l.employee.department?.name || '',
        l.leaveType,
        l.startDate.toISOString().split('T')[0],
        l.endDate.toISOString().split('T')[0],
        l.totalDays,
        l.status,
        l.reason,
        l.reviewedBy || ''
      ]);

      const csvContent = toCSV([header, ...dataRows]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leave_summary_report.csv"');
      res.status(200).send(csvContent);
      return;
    }

    res.json({ success: true, data: leaves, count: leaves.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/reports/payroll
router.get('/payroll', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, format } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const payrolls = await prisma.payrollRecord.findMany({
      where: { month: targetMonth, year: targetYear },
      include: {
        employee: {
          select: {
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            department: { select: { name: true } }
          }
        }
      },
      orderBy: { employee: { firstName: 'asc' } }
    });

    if (format === 'csv') {
      const header = ['Payroll ID', 'Employee Code', 'Employee Name', 'Department', 'Designation', 'Month/Year', 'Basic Salary', 'Total Allowances', 'Total Deductions', 'Net Salary', 'Payment Status', 'Payment Date'];
      const dataRows = payrolls.map(p => [
        p.id,
        p.employee.employeeCode,
        `${p.employee.firstName} ${p.employee.lastName}`,
        p.employee.department?.name || '',
        p.employee.designation,
        `${p.month}/${p.year}`,
        p.basicSalary,
        p.totalAllowances,
        p.totalDeductions,
        p.netSalary,
        p.paymentStatus,
        p.paymentDate ? p.paymentDate.toISOString().split('T')[0] : ''
      ]);

      const csvContent = toCSV([header, ...dataRows]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="payroll_report_${targetMonth}_${targetYear}.csv"`);
      res.status(200).send(csvContent);
      return;
    }

    res.json({ success: true, data: payrolls, count: payrolls.length });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
