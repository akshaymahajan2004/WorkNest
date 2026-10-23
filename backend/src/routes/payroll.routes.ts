import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role, PayrollStatus, EmployeeStatus } from '@prisma/client';

const router = Router();

// GET /api/payroll/records - List payroll records by month & year
router.get('/records', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year, status, departmentId } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const where: any = {
      month: targetMonth,
      year: targetYear
    };

    // Employee role restriction
    if (req.user?.role === Role.EMPLOYEE) {
      const empId = req.user.employee?.id;
      if (!empId) {
        res.json({ success: true, data: [] });
        return;
      }
      where.employeeId = empId;
    } else {
      if (departmentId && departmentId !== 'ALL') {
        where.employee = { departmentId: String(departmentId) };
      }
      if (status && status !== 'ALL') {
        where.paymentStatus = status as PayrollStatus;
      }
    }

    const records = await prisma.payrollRecord.findMany({
      where,
      orderBy: { employee: { firstName: 'asc' } },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            avatar: true,
            designation: true,
            department: { select: { id: true, name: true, code: true } }
          }
        }
      }
    });

    // Summary calculations
    const totalPayroll = records.reduce((acc, r) => acc + r.netSalary, 0);
    const totalAllowances = records.reduce((acc, r) => acc + r.totalAllowances, 0);
    const totalDeductions = records.reduce((acc, r) => acc + r.totalDeductions, 0);

    res.json({
      success: true,
      data: records,
      summary: {
        count: records.length,
        totalPayroll,
        totalAllowances,
        totalDeductions,
        month: targetMonth,
        year: targetYear
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payroll/structures - List salary structures
router.get('/structures', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const structures = await prisma.salaryStructure.findMany({
      include: {
        employee: {
          select: {
            id: true,
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

    res.json({ success: true, data: structures });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/payroll/structures/:employeeId - Update salary structure
router.put('/structures/:employeeId', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const {
      basicSalary = 0,
      hra = 0,
      conveyance = 0,
      medicalAllowance = 0,
      specialAllowance = 0,
      pfDeduction = 0,
      taxDeduction = 0,
      otherDeductions = 0
    } = req.body;

    const totalAllowances = hra + conveyance + medicalAllowance + specialAllowance;
    const totalDeductions = pfDeduction + taxDeduction + otherDeductions;
    const netSalary = (basicSalary + totalAllowances) - totalDeductions;

    const structure = await prisma.salaryStructure.upsert({
      where: { employeeId },
      create: {
        employeeId,
        basicSalary,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,
        pfDeduction,
        taxDeduction,
        otherDeductions,
        netSalary
      },
      update: {
        basicSalary,
        hra,
        conveyance,
        medicalAllowance,
        specialAllowance,
        pfDeduction,
        taxDeduction,
        otherDeductions,
        netSalary
      }
    });

    res.json({ success: true, data: structure, message: 'Salary structure updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/payroll/generate-batch - Generate batch payroll for all active employees
router.post('/generate-batch', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.body;
    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const employees = await prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
      include: { salaryStructure: true }
    });

    let createdCount = 0;
    let updatedCount = 0;

    for (const emp of employees) {
      const basic = emp.salaryStructure?.basicSalary || 5000;
      const allowances = (emp.salaryStructure?.hra || 0) +
        (emp.salaryStructure?.conveyance || 0) +
        (emp.salaryStructure?.medicalAllowance || 0) +
        (emp.salaryStructure?.specialAllowance || 0);
      const deductions = (emp.salaryStructure?.pfDeduction || 0) +
        (emp.salaryStructure?.taxDeduction || 0) +
        (emp.salaryStructure?.otherDeductions || 0);
      const net = (basic + allowances) - deductions;

      const existing = await prisma.payrollRecord.findUnique({
        where: {
          employeeId_month_year: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear
          }
        }
      });

      if (existing) {
        if (existing.paymentStatus !== PayrollStatus.PAID) {
          await prisma.payrollRecord.update({
            where: { id: existing.id },
            data: {
              basicSalary: basic,
              totalAllowances: allowances,
              totalDeductions: deductions,
              netSalary: net
            }
          });
          updatedCount++;
        }
      } else {
        await prisma.payrollRecord.create({
          data: {
            employeeId: emp.id,
            month: targetMonth,
            year: targetYear,
            basicSalary: basic,
            totalAllowances: allowances,
            totalDeductions: deductions,
            netSalary: net,
            paymentStatus: PayrollStatus.DRAFT,
            notes: `Payroll generated for ${targetMonth}/${targetYear}`
          }
        });
        createdCount++;
      }
    }

    // Activity Log
    await prisma.activityLog.create({
      data: {
        actorName: req.user?.email || 'Admin',
        action: 'Batch Payroll Generated',
        module: 'Payroll',
        details: `Processed payroll for ${targetMonth}/${targetYear}. Created: ${createdCount}, Updated: ${updatedCount}.`
      }
    });

    res.json({
      success: true,
      message: `Batch payroll generated: ${createdCount} created, ${updatedCount} updated.`,
      stats: { createdCount, updatedCount }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/payroll/records/:id/status - Update payment status (DRAFT -> PROCESSED -> PAID)
router.put('/records/:id/status', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, paymentDate } = req.body;

    if (!Object.values(PayrollStatus).includes(status)) {
      res.status(400).json({ success: false, message: 'Invalid payroll status' });
      return;
    }

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        paymentStatus: status as PayrollStatus,
        paymentDate: status === PayrollStatus.PAID ? (paymentDate ? new Date(paymentDate) : new Date()) : null
      },
      include: {
        employee: { select: { firstName: true, lastName: true } }
      }
    });

    res.json({ success: true, data: updated, message: `Status updated to ${status}` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/payroll/payslip/:id - Detailed Payslip with company info & itemized breakdowns
router.get('/payslip/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            salaryStructure: true
          }
        }
      }
    });

    if (!record) {
      res.status(404).json({ success: false, message: 'Payroll record not found' });
      return;
    }

    // Role check: Employee can only view their own payslip
    if (req.user?.role === Role.EMPLOYEE && record.employeeId !== req.user.employee?.id) {
      res.status(403).json({ success: false, message: 'Forbidden. You can only view your own payslip.' });
      return;
    }

    const company = await prisma.companySetting.findFirst();

    res.json({
      success: true,
      data: {
        payroll: record,
        employee: record.employee,
        salaryStructure: record.employee.salaryStructure,
        company: company || {
          companyName: 'Nexus Global Enterprises',
          companyEmail: 'payroll@nexusglobal.io',
          companyPhone: '+1 (800) 555-0199',
          companyAddress: '500 Silicon Vista Way, San Francisco, CA',
          currency: '$'
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
