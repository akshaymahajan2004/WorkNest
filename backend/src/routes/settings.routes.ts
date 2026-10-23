import { Router, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

// GET /api/settings/company
router.get('/company', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    let company = await prisma.companySetting.findFirst();
    if (!company) {
      company = await prisma.companySetting.create({
        data: {
          companyName: 'Nexus Global Enterprises',
          companyEmail: 'contact@nexusglobal.io',
          companyPhone: '+1 (800) 555-0199',
          companyAddress: '500 Silicon Vista Way, Suite 700, San Francisco, CA',
          currency: '$',
          timezone: 'America/Los_Angeles',
          workingHoursPerDay: 8.0,
          leavePolicy: '15 Annual, 10 Sick, 10 Casual days per year.'
        }
      });
    }

    res.json({ success: true, data: company });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings/company - Update company details (ADMIN only)
router.put('/company', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { companyName, companyEmail, companyPhone, companyAddress, currency, timezone, workingHoursPerDay, leavePolicy } = req.body;

    const company = await prisma.companySetting.findFirst();
    if (!company) {
      res.status(404).json({ success: false, message: 'Company settings not found' });
      return;
    }

    const updated = await prisma.companySetting.update({
      where: { id: company.id },
      data: {
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        currency,
        timezone,
        workingHoursPerDay: workingHoursPerDay ? parseFloat(String(workingHoursPerDay)) : company.workingHoursPerDay,
        leavePolicy
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        actorName: req.user?.email || 'Admin',
        action: 'Company Settings Updated',
        module: 'Settings',
        details: `Updated company profile details for ${updated.companyName}.`
      }
    });

    res.json({ success: true, data: updated, message: 'Company profile updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings/users - List all users (ADMIN only)
router.get('/users', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatar: true,
            department: { select: { name: true } }
          }
        }
      }
    });

    res.json({ success: true, data: users });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/settings/users/:id - Update user status or role (ADMIN only)
router.put('/users/:id', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role, isActive } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role: role ? (role as Role) : undefined,
        isActive: isActive !== undefined ? Boolean(isActive) : undefined
      }
    });

    res.json({ success: true, data: updated, message: 'User updated successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings/audit-logs - System activity logs
router.get('/audit-logs', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const logs = await prisma.activityLog.findMany({
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: logs });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settings/permissions - Permission Matrix
router.get('/permissions', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const matrix = [
    { module: 'Dashboard Analytics', admin: true, hr: true, employee: 'Own metrics only' },
    { module: 'Employee Directory', admin: 'Full CRUD', hr: 'Create & Edit', employee: 'View Only' },
    { module: 'Department Management', admin: 'Full CRUD', hr: 'Create & Edit', employee: 'View Only' },
    { module: 'Attendance Punching', admin: true, hr: true, employee: 'Self-Service' },
    { module: 'Attendance Roster & Overrides', admin: true, hr: true, employee: false },
    { module: 'Apply for Leaves', admin: true, hr: true, employee: true },
    { module: 'Approve / Reject Leaves', admin: true, hr: true, employee: false },
    { module: 'Payroll Generation & Edit', admin: true, hr: true, employee: false },
    { module: 'Download Payslips', admin: 'All', hr: 'All', employee: 'Own Only' },
    { module: 'Generate & Export Reports', admin: true, hr: true, employee: false },
    { module: 'Company & Security Settings', admin: true, hr: false, employee: false }
  ];

  res.json({ success: true, data: matrix });
});

export default router;
