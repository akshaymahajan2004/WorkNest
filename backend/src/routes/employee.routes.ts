import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role, EmploymentType, EmployeeStatus } from '@prisma/client';

const router = Router();

// Validation schema for creating employee
const createEmployeeSchema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  designation: z.string().min(2, 'Designation is required'),
  departmentId: z.string().optional(),
  employmentType: z.nativeEnum(EmploymentType).default(EmploymentType.FULL_TIME),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  joiningDate: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  basicSalary: z.number().nonnegative().optional().default(5000),
  password: z.string().min(6).optional().default('Emp@123')
});

// GET /api/employees - Search, filter, pagination, sorting
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      departmentId,
      status,
      employmentType,
      sortBy = 'createdAt',
      order = 'desc',
      page = '1',
      limit = '10'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 10));
    const skip = (pageNumber - 1) * pageSize;

    const where: any = {};

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { employeeCode: { contains: q, mode: 'insensitive' } },
        { designation: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (departmentId && departmentId !== 'ALL') {
      where.departmentId = String(departmentId);
    }

    if (status && status !== 'ALL') {
      where.status = status as EmployeeStatus;
    }

    if (employmentType && employmentType !== 'ALL') {
      where.employmentType = employmentType as EmploymentType;
    }

    // Role check: If EMPLOYEE role and not ADMIN/HR, return all or filtered list
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: {
          [String(sortBy)]: order === 'asc' ? 'asc' : 'desc'
        },
        include: {
          department: {
            select: { id: true, name: true, code: true }
          },
          salaryStructure: {
            select: { netSalary: true, basicSalary: true }
          }
        }
      }),
      prisma.employee.count({ where })
    ]);

    res.json({
      success: true,
      data: employees,
      pagination: {
        page: pageNumber,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/employees/:id - Detailed Employee Profile
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        user: {
          select: { id: true, email: true, role: true, isActive: true }
        },
        salaryStructure: true,
        leaveBalances: {
          where: { year: new Date().getFullYear() }
        },
        leaves: {
          take: 10,
          orderBy: { appliedAt: 'desc' }
        },
        attendances: {
          take: 15,
          orderBy: { date: 'desc' }
        },
        payrollRecords: {
          take: 6,
          orderBy: [{ year: 'desc' }, { month: 'desc' }]
        }
      }
    });

    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    res.json({ success: true, data: employee });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/employees - Create Employee (ADMIN, HR)
router.post('/', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = createEmployeeSchema.parse(req.body);

    // Check if email already exists
    const existing = await prisma.employee.findUnique({
      where: { email: parsed.email.toLowerCase() }
    });

    if (existing) {
      res.status(400).json({ success: false, message: 'An employee with this email already exists' });
      return;
    }

    // Auto-generate employee code (EMP-XXX)
    const count = await prisma.employee.count();
    const nextCode = `EMP-${String(count + 1).padStart(3, '0')}`;

    // Create user account for login
    const hashedPassword = await bcrypt.hash(parsed.password, 10);
    const user = await prisma.user.create({
      data: {
        email: parsed.email.toLowerCase(),
        passwordHash: hashedPassword,
        role: Role.EMPLOYEE,
        isActive: parsed.status === EmployeeStatus.ACTIVE
      }
    });

    // Create Employee record
    const employee = await prisma.employee.create({
      data: {
        employeeCode: nextCode,
        firstName: parsed.firstName,
        lastName: parsed.lastName,
        email: parsed.email.toLowerCase(),
        phone: parsed.phone,
        avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${parsed.firstName}%20${parsed.lastName}`,
        designation: parsed.designation,
        departmentId: parsed.departmentId || null,
        employmentType: parsed.employmentType,
        status: parsed.status,
        joiningDate: parsed.joiningDate ? new Date(parsed.joiningDate) : new Date(),
        gender: parsed.gender,
        address: parsed.address,
        userId: user.id
      },
      include: {
        department: true
      }
    });

    // Initialize Default Leave Balance for current year
    const currentYear = new Date().getFullYear();
    await prisma.leaveBalance.create({
      data: {
        employeeId: employee.id,
        year: currentYear,
        annualTotal: 15,
        annualUsed: 0,
        sickTotal: 10,
        sickUsed: 0,
        casualTotal: 10,
        casualUsed: 0
      }
    });

    // Initialize Salary Structure
    const basic = parsed.basicSalary || 5000;
    const hra = Math.round(basic * 0.4);
    const conveyance = 300;
    const medical = 200;
    const special = Math.round(basic * 0.2);
    const pf = Math.round(basic * 0.12);
    const tax = Math.round((basic + hra) * 0.1);
    const totalAllowances = hra + conveyance + medical + special;
    const totalDeductions = pf + tax;
    const net = (basic + totalAllowances) - totalDeductions;

    await prisma.salaryStructure.create({
      data: {
        employeeId: employee.id,
        basicSalary: basic,
        hra,
        conveyance,
        medicalAllowance: medical,
        specialAllowance: special,
        pfDeduction: pf,
        taxDeduction: tax,
        otherDeductions: 0,
        netSalary: net
      }
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        actorName: req.user?.email || 'Admin',
        action: 'Employee Created',
        module: 'Employees',
        details: `Created employee record for ${parsed.firstName} ${parsed.lastName} (${nextCode})`
      }
    });

    res.status(201).json({ success: true, data: employee });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/employees/:id - Update Employee (ADMIN, HR)
router.put('/:id', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      designation,
      departmentId,
      employmentType,
      status,
      joiningDate,
      gender,
      address
    } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    const updated = await prisma.employee.update({
      where: { id },
      data: {
        firstName: firstName ?? existing.firstName,
        lastName: lastName ?? existing.lastName,
        email: email ? email.toLowerCase() : existing.email,
        phone: phone ?? existing.phone,
        designation: designation ?? existing.designation,
        departmentId: departmentId !== undefined ? (departmentId || null) : existing.departmentId,
        employmentType: employmentType ?? existing.employmentType,
        status: status ?? existing.status,
        joiningDate: joiningDate ? new Date(joiningDate) : existing.joiningDate,
        gender: gender ?? existing.gender,
        address: address ?? existing.address
      },
      include: {
        department: true
      }
    });

    // Sync active status with user if updated
    if (existing.userId && status) {
      await prisma.user.update({
        where: { id: existing.userId },
        data: { isActive: status === EmployeeStatus.ACTIVE }
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/employees/:id - Delete Employee (ADMIN only)
router.delete('/:id', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({ where: { id } });
    if (!employee) {
      res.status(404).json({ success: false, message: 'Employee not found' });
      return;
    }

    // Delete associated User account if exists
    if (employee.userId) {
      await prisma.user.delete({ where: { id: employee.userId } }).catch(() => {});
    }

    await prisma.employee.delete({ where: { id } });

    res.json({ success: true, message: `Employee ${employee.firstName} ${employee.lastName} removed successfully.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
