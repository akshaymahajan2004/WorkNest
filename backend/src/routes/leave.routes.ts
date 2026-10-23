import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role, LeaveStatus, LeaveType } from '@prisma/client';

const router = Router();

const applyLeaveSchema = z.object({
  leaveType: z.nativeEnum(LeaveType),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  totalDays: z.number().positive('Total days must be at least 1'),
  reason: z.string().min(5, 'Reason must be at least 5 characters')
});

// GET /api/leaves - List leaves with filters
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, employeeId, leaveType } = req.query;

    const where: any = {};

    // If regular Employee, show only their own leaves unless they are Admin/HR
    if (req.user?.role === Role.EMPLOYEE) {
      const empId = req.user.employee?.id;
      if (!empId) {
        res.json({ success: true, data: [] });
        return;
      }
      where.employeeId = empId;
    } else if (employeeId && employeeId !== 'ALL') {
      where.employeeId = String(employeeId);
    }

    if (status && status !== 'ALL') {
      where.status = status as LeaveStatus;
    }

    if (leaveType && leaveType !== 'ALL') {
      where.leaveType = leaveType as LeaveType;
    }

    const leaves = await prisma.leave.findMany({
      where,
      orderBy: { appliedAt: 'desc' },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            avatar: true,
            designation: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    res.json({ success: true, data: leaves });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/leaves/balances - Leave balance for employee
router.get('/balances', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.query.employeeId as string;
    if (!employeeId || req.user?.role === Role.EMPLOYEE) {
      employeeId = req.user?.employee?.id || '';
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee ID required' });
      return;
    }

    const currentYear = new Date().getFullYear();
    let balance = await prisma.leaveBalance.findUnique({
      where: {
        employeeId_year: {
          employeeId,
          year: currentYear
        }
      }
    });

    if (!balance) {
      balance = await prisma.leaveBalance.create({
        data: {
          employeeId,
          year: currentYear,
          annualTotal: 15,
          annualUsed: 0,
          sickTotal: 10,
          sickUsed: 0,
          casualTotal: 10,
          casualUsed: 0
        }
      });
    }

    res.json({
      success: true,
      data: {
        ...balance,
        annualRemaining: balance.annualTotal - balance.annualUsed,
        sickRemaining: balance.sickTotal - balance.sickUsed,
        casualRemaining: balance.casualTotal - balance.casualUsed
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/leaves/apply - Apply for leave
router.post('/apply', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = applyLeaveSchema.parse(req.body);

    let employeeId = req.body.employeeId;
    if (!employeeId || req.user?.role === Role.EMPLOYEE) {
      employeeId = req.user?.employee?.id;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile not identified' });
      return;
    }

    const start = new Date(parsed.startDate);
    const end = new Date(parsed.endDate);
    if (end < start) {
      res.status(400).json({ success: false, message: 'End date cannot be earlier than start date' });
      return;
    }

    const leave = await prisma.leave.create({
      data: {
        employeeId,
        leaveType: parsed.leaveType,
        startDate: start,
        endDate: end,
        totalDays: parsed.totalDays,
        reason: parsed.reason,
        status: LeaveStatus.PENDING
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true, employeeCode: true }
        }
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        actorName: `${leave.employee.firstName} ${leave.employee.lastName}`,
        action: 'Leave Application Submitted',
        module: 'Leaves',
        details: `Requested ${parsed.totalDays} day(s) ${parsed.leaveType} leave.`
      }
    });

    res.status(201).json({ success: true, data: leave, message: 'Leave application submitted successfully.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/leaves/:id/review - Approve or Reject Leave (ADMIN, HR)
router.put('/:id/review', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!status || (status !== LeaveStatus.APPROVED && status !== LeaveStatus.REJECTED)) {
      res.status(400).json({ success: false, message: 'Status must be APPROVED or REJECTED' });
      return;
    }

    const leave = await prisma.leave.findUnique({
      where: { id },
      include: { employee: true }
    });

    if (!leave) {
      res.status(404).json({ success: false, message: 'Leave application not found' });
      return;
    }

    if (leave.status !== LeaveStatus.PENDING) {
      res.status(400).json({ success: false, message: `Leave has already been ${leave.status.toLowerCase()}` });
      return;
    }

    const reviewerName = req.user?.employee ? `${req.user.employee.firstName} ${req.user.employee.lastName}` : req.user?.email || 'HR Admin';

    // If approved, update employee leave balance
    if (status === LeaveStatus.APPROVED) {
      const currentYear = new Date().getFullYear();
      const balance = await prisma.leaveBalance.findUnique({
        where: {
          employeeId_year: {
            employeeId: leave.employeeId,
            year: currentYear
          }
        }
      });

      if (balance) {
        if (leave.leaveType === LeaveType.ANNUAL) {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: { annualUsed: balance.annualUsed + leave.totalDays }
          });
        } else if (leave.leaveType === LeaveType.SICK) {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: { sickUsed: balance.sickUsed + leave.totalDays }
          });
        } else if (leave.leaveType === LeaveType.CASUAL) {
          await prisma.leaveBalance.update({
            where: { id: balance.id },
            data: { casualUsed: balance.casualUsed + leave.totalDays }
          });
        }
      }
    }

    const updated = await prisma.leave.update({
      where: { id },
      data: {
        status: status as LeaveStatus,
        reviewedBy: reviewerName,
        rejectionReason: status === LeaveStatus.REJECTED ? rejectionReason : null,
        reviewedAt: new Date()
      },
      include: {
        employee: {
          select: { firstName: true, lastName: true }
        }
      }
    });

    // Activity Log
    await prisma.activityLog.create({
      data: {
        actorName: reviewerName,
        action: `Leave ${status}`,
        module: 'Leaves',
        details: `${status} ${leave.totalDays} days leave for ${updated.employee.firstName} ${updated.employee.lastName}.`
      }
    });

    res.json({ success: true, data: updated, message: `Leave application marked as ${status}.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
