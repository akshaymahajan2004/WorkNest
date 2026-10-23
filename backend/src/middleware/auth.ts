import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  employee?: {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    designation: string;
    avatar: string | null;
    departmentId: string | null;
  } | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-ems-jwt-key-change-in-production-2026';

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ success: false, message: 'Authentication required. No token provided.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: Role };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        employee: {
          select: {
            id: true,
            employeeCode: true,
            firstName: true,
            lastName: true,
            designation: true,
            avatar: true,
            departmentId: true
          }
        }
      }
    });

    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User account not found or inactive.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      employee: user.employee
    };

    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

export const authorize = (allowedRoles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized. Please login.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Forbidden. Role '${req.user.role}' lacks permission for this action.`
      });
      return;
    }

    next();
  };
};
