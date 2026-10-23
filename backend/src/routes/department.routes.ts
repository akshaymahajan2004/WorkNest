import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize, AuthRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();

const departmentSchema = z.object({
  name: z.string().min(2, 'Department name is required'),
  code: z.string().min(2, 'Code is required (e.g. ENG, HR)'),
  description: z.string().optional(),
  budget: z.number().nonnegative().optional().default(0),
  headId: z.string().nullable().optional()
});

// GET /api/departments - list with member counts and heads
router.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { employees: true }
        }
      }
    });

    // Populate department heads info
    const headIds = departments.map(d => d.headId).filter(Boolean) as string[];
    const heads = await prisma.employee.findMany({
      where: { id: { in: headIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        designation: true,
        email: true
      }
    });
    const headMap = new Map(heads.map(h => [h.id, h]));

    const enriched = departments.map(d => ({
      ...d,
      employeeCount: d._count.employees,
      head: d.headId ? headMap.get(d.headId) || null : null
    }));

    res.json({ success: true, data: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/departments/:id - Single department with full member roster
router.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            email: true,
            designation: true,
            avatar: true,
            status: true,
            employmentType: true,
            joiningDate: true
          },
          orderBy: { firstName: 'asc' }
        }
      }
    });

    if (!department) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    let head = null;
    if (department.headId) {
      head = await prisma.employee.findUnique({
        where: { id: department.headId },
        select: { id: true, firstName: true, lastName: true, avatar: true, email: true, designation: true }
      });
    }

    res.json({
      success: true,
      data: {
        ...department,
        head
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/departments - Create (ADMIN, HR)
router.post('/', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const parsed = departmentSchema.parse(req.body);

    const existingName = await prisma.department.findFirst({
      where: {
        OR: [
          { name: { equals: parsed.name, mode: 'insensitive' } },
          { code: { equals: parsed.code, mode: 'insensitive' } }
        ]
      }
    });

    if (existingName) {
      res.status(400).json({ success: false, message: 'Department with this name or code already exists' });
      return;
    }

    const dept = await prisma.department.create({
      data: {
        name: parsed.name,
        code: parsed.code.toUpperCase(),
        description: parsed.description,
        budget: parsed.budget || 0,
        headId: parsed.headId || null
      }
    });

    res.status(201).json({ success: true, data: dept });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /api/departments/:id - Update (ADMIN, HR)
router.put('/:id', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, code, description, budget, headId } = req.body;

    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, message: 'Department not found' });
      return;
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: name ?? existing.name,
        code: code ? code.toUpperCase() : existing.code,
        description: description ?? existing.description,
        budget: budget !== undefined ? budget : existing.budget,
        headId: headId !== undefined ? (headId || null) : existing.headId
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/departments/:id/assign - Assign employees to department
router.post('/:id/assign', authenticate, authorize([Role.ADMIN, Role.HR]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { employeeIds } = req.body; // array of string IDs

    if (!Array.isArray(employeeIds)) {
      res.status(400).json({ success: false, message: 'employeeIds must be an array' });
      return;
    }

    await prisma.employee.updateMany({
      where: { id: { in: employeeIds } },
      data: { departmentId: id }
    });

    res.json({ success: true, message: `Assigned ${employeeIds.length} employee(s) to department.` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/departments/:id - Delete (ADMIN only)
router.delete('/:id', authenticate, authorize([Role.ADMIN]), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const employeeCount = await prisma.employee.count({
      where: { departmentId: id }
    });

    if (employeeCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete department with ${employeeCount} assigned employee(s). Please reassign them first.`
      });
      return;
    }

    await prisma.department.delete({ where: { id } });
    res.json({ success: true, message: 'Department deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
