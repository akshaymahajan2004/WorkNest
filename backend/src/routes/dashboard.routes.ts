import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { EmployeeStatus, AttendanceStatus, LeaveStatus } from '@prisma/client';

const router = Router();

router.get('/stats', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // 1. Employee Counts
    const totalEmployees = await prisma.employee.count();
    const activeEmployees = await prisma.employee.count({
      where: { status: EmployeeStatus.ACTIVE }
    });
    const onLeaveEmployees = await prisma.employee.count({
      where: { status: EmployeeStatus.ON_LEAVE }
    });
    const newHiresThisMonth = await prisma.employee.count({
      where: {
        joiningDate: { gte: firstDayOfMonth }
      }
    });

    // 2. Today's Attendance
    const todayAttendance = await prisma.attendance.findMany({
      where: { date: today }
    });

    const presentToday = todayAttendance.filter(a => a.status === AttendanceStatus.PRESENT || a.status === AttendanceStatus.LATE || a.status === AttendanceStatus.HALF_DAY).length;
    const lateToday = todayAttendance.filter(a => a.status === AttendanceStatus.LATE).length;
    const absentToday = todayAttendance.filter(a => a.status === AttendanceStatus.ABSENT).length;

    // 3. Department Distribution
    const departments = await prisma.department.findMany({
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    const departmentDistribution = departments.map(d => ({
      id: d.id,
      name: d.name,
      code: d.code,
      count: d._count.employees,
      percentage: totalEmployees > 0 ? Math.round((d._count.employees / totalEmployees) * 100) : 0
    }));

    // 4. Weekly Attendance Trend (Last 7 Days)
    const weeklyAttendance: Array<{ date: string; day: string; present: number; late: number; absent: number }> = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(0, 0, 0, 0);

      const records = await prisma.attendance.findMany({
        where: { date: targetDate }
      });

      const p = records.filter(r => r.status === AttendanceStatus.PRESENT || r.status === AttendanceStatus.HALF_DAY).length;
      const l = records.filter(r => r.status === AttendanceStatus.LATE).length;
      const a = records.filter(r => r.status === AttendanceStatus.ABSENT).length;

      weeklyAttendance.push({
        date: targetDate.toISOString().split('T')[0],
        day: daysOfWeek[targetDate.getDay()],
        present: p,
        late: l,
        absent: a
      });
    }

    // 5. Recent Hires (5 most recent)
    const recentHires = await prisma.employee.findMany({
      take: 5,
      orderBy: { joiningDate: 'desc' },
      include: {
        department: {
          select: { name: true, code: true }
        }
      }
    });

    // 6. Pending Leave Requests (latest 5)
    const pendingLeaves = await prisma.leave.findMany({
      where: { status: LeaveStatus.PENDING },
      take: 5,
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

    // 7. Total Payroll Estimate (current month processed or draft)
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const payrollAgg = await prisma.payrollRecord.aggregate({
      where: { month: currentMonth, year: currentYear },
      _sum: { netSalary: true }
    });

    const monthlyPayrollTotal = payrollAgg._sum.netSalary || 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalEmployees,
          activeEmployees,
          onLeaveEmployees,
          presentToday: presentToday || (totalEmployees - onLeaveEmployees), // fallback to sensible default if today hasn't punched yet
          lateToday,
          absentToday,
          newHiresThisMonth,
          monthlyPayrollTotal
        },
        departmentDistribution,
        weeklyAttendance,
        recentHires,
        pendingLeaves
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
