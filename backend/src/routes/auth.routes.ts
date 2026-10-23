import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';
import { Role } from '@prisma/client';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ems-jwt-key-change-in-production-2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

// Regular Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatar: true,
            departmentId: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
      }
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, message: error.errors[0].message });
      return;
    }
    res.status(500).json({ success: false, message: error.message || 'Login failed' });
  }
});

// Demo Login (quick switch for Admin, HR, Employee)
router.post('/demo-login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    let targetEmail = 'admin@enterprise-ems.com';
    if (role === 'HR') targetEmail = 'hr@enterprise-ems.com';
    if (role === 'EMPLOYEE') targetEmail = 'john.doe@enterprise-ems.com';

    const user = await prisma.user.findUnique({
      where: { email: targetEmail },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatar: true,
            departmentId: true,
            department: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: `Demo user for role ${role} not found` });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Demo login failed' });
  }
});

// Get Current User
router.get('/me', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        employee: {
          include: {
            department: {
              select: { id: true, name: true, code: true }
            }
          }
        }
      }
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        employee: user.employee
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
