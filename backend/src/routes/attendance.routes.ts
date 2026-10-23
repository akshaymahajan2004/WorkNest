import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role, AttendanceStatus } from '@prisma/client';

const router = Router();

// GET /api/attendance - Daily attendance roster
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, departmentId, status } = req.query;

    const targetDate = date ? new Date(String(date)) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Build employee filter
    const employeeWhere: any = {};
    if (departmentId && departmentId !== 'ALL') {
      employeeWhere.departmentId = String(departmentId);
    }

    // Fetch all active employees matching filters
    const employees = await prisma.employee.findMany({
      where: employeeWhere,
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        employeeCode: true,
        firstName: true,
        lastName: true,
        avatar: true,
        designation: true,
        department: {
          select: { id: true, name: true, code: true }
        }
      }
    });

    // Fetch attendance records for this date
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        date: targetDate,
        employeeId: { in: employees.map(e => e.id) }
      }
    });

    const recordMap = new Map(attendanceRecords.map(r => [r.employeeId, r]));

    // Merge employees with their attendance records
    let roster = employees.map(emp => {
      const record = recordMap.get(emp.id);
      return {
        employee: emp,
        attendanceId: record?.id || null,
        date: targetDate,
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        workHours: record?.workHours || 0,
        status: record?.status || AttendanceStatus.ABSENT,
        isRecorded: !!record,
        notes: record?.notes || null
      };
    });

    if (status && status !== 'ALL') {
      roster = roster.filter(r => r.status === status);
    }

    // Summary stats for the day
    const totalCount = roster.length;
    const presentCount = roster.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const lateCount = roster.filter(r => r.status === AttendanceStatus.LATE).length;
    const halfDayCount = roster.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
    const absentCount = roster.filter(r => r.status === AttendanceStatus.ABSENT).length;

    res.json({
      success: true,
      data: roster,
      summary: {
        total: totalCount,
        present: presentCount,
        late: lateCount,
        halfDay: halfDayCount,
        absent: absentCount,
        date: targetDate.toISOString().split('T')[0]
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/attendance/my-status - Today's punch status for current user
router.get('/my-status', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const employeeId = req.user?.employee?.id;
    if (!employeeId) {
      res.json({ success: true, data: null, message: 'No employee profile linked to user.' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const record = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    });

    res.json({
      success: true,
      data: record || {
        date: today,
        checkIn: null,
        checkOut: null,
        status: null,
        workHours: 0
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/attendance/check-in - Self-service Check-In
router.post('/check-in', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.body.employeeId;
    if (!employeeId || req.user?.role === Role.EMPLOYEE) {
      employeeId = req.user?.employee?.id;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile not identified.' });
      return;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    // Check if already checked in
    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    });

    if (existing && existing.checkIn) {
      res.status(400).json({ success: false, message: 'Already checked in for today.' });
      return;
    }

    // Determine status (if after 9:30 AM -> LATE)
    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 30);
    const status = isLate ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      },
      create: {
        employeeId,
        date: today,
        checkIn: now,
        status,
        notes: isLate ? 'Checked in after 9:30 AM' : 'On-time check-in'
      },
      update: {
        checkIn: now,
        status,
        notes: isLate ? 'Checked in after 9:30 AM' : 'On-time check-in'
      }
    });

    res.json({ success: true, data: record, message: 'Checked in successfully!' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/attendance/check-out - Self-service Check-Out
router.post('/check-out', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let employeeId = req.body.employeeId;
    if (!employeeId || req.user?.role === Role.EMPLOYEE) {
      employeeId = req.user?.employee?.id;
    }

    if (!employeeId) {
      res.status(400).json({ success: false, message: 'Employee profile not identified.' });
      return;
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

    const existing = await prisma.attendance.findUnique({
      where: {
        employeeId_date: {
          employeeId,
          date: today
        }
      }
    });

    if (!existing || !existing.checkIn) {
      res.status(400).json({ success: false, message: 'Must check in before checking out.' });
      return;
    }

    const checkInMs = existing.checkIn.getTime();
    const checkOutMs = now.getTime();
    const diffHours = parseFloat(((checkOutMs - checkInMs) / (1000 * 60 * 60)).toFixed(2));

    // If worked less than 5 hours, flag as Half Day
    let status = existing.status;
    if (diffHours < 5 && status !== AttendanceStatus.LATE) {
      status = AttendanceStatus.HALF_DAY;
    }

    const record = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        checkOut: now,
        workHours: diffHours,
        status
      }
    });

    res.json({ success: true, data: record, message: `Checked out successfully! Total: ${diffHours} hrs.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/attendance/mark - Admin/HR manual mark/override
router.post('/mark', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { employeeId, date, status, checkIn, checkOut, notes } = req.body;

    if (!employeeId || !date || !status) {
      res.status(400).json({ success: false, message: 'employeeId, date, and status are required' });
      return;
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    let checkInDate = checkIn ? new Date(checkIn) : null;
    let checkOutDate = checkOut ? new Date(checkOut) : null;
    let workHours = 0;

    if (checkInDate && checkOutDate) {
      workHours = parseFloat(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2));
    } else if (status === AttendanceStatus.PRESENT) {
      workHours = 8.0;
    } else if (status === AttendanceStatus.HALF_DAY) {
      workHours = 4.0;
    }

    const record = await prisma.attendance.upsert({
      where: {
        employeeId_date: {
          employeeId,
          date: targetDate
        }
      },
      create: {
        employeeId,
        date: targetDate,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: status as AttendanceStatus,
        workHours: Math.max(0, workHours),
        notes
      },
      update: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        status: status as AttendanceStatus,
        workHours: Math.max(0, workHours),
        notes
      }
    });

    res.json({ success: true, data: record, message: 'Attendance marked successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/attendance/monthly-summary
router.get('/monthly-summary', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { month, year } = req.query;
    const now = new Date();
    const targetMonth = month ? parseInt(String(month), 10) : now.getMonth() + 1;
    const targetYear = year ? parseInt(String(year), 10) : now.getFullYear();

    const startOfMonth = new Date(targetYear, targetMonth - 1, 1);
    const endOfMonth = new Date(targetYear, targetMonth, 0, 23, 59, 59);

    const records = await prisma.attendance.findMany({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            department: { select: { name: true } }
          }
        }
      }
    });

    const totalRecords = records.length;
    const present = records.filter(r => r.status === AttendanceStatus.PRESENT).length;
    const late = records.filter(r => r.status === AttendanceStatus.LATE).length;
    const halfDay = records.filter(r => r.status === AttendanceStatus.HALF_DAY).length;
    const absent = records.filter(r => r.status === AttendanceStatus.ABSENT).length;

    const rate = totalRecords > 0 ? Math.round(((present + late + halfDay * 0.5) / totalRecords) * 100) : 100;

    res.json({
      success: true,
      data: {
        month: targetMonth,
        year: targetYear,
        totalRecords,
        present,
        late,
        halfDay,
        absent,
        attendanceRate: rate
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
