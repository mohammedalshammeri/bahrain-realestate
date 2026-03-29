import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../config/jwt';

export interface AdminAuthRequest extends Request {
  admin?: {
    adminId: number;
    username: string;
    role: string;
  };
}

export const adminAuthMiddleware = async (req: AdminAuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: "لا يوجد رمز مصادقة"
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token) as any;

    if (!decoded || !['admin', 'SUPER_ADMIN', 'ADMIN'].includes(decoded.role)) {
      return res.status(403).json({
        success: false,
        message: "مطلوب صلاحية المدير"
      });
    }

    req.admin = {
      adminId: decoded.adminId,
      username: decoded.username,
      role: decoded.role
    };

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: "رمز المصادقة غير صالح أو منتهي الصلاحية"
    });
  }
};
