import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";
import { generateToken } from "../config/jwt";
import {
  registerAdminService,
  registerCompanyService,
  loginAdminService,
  validateTokenService,
  registerIndividualService,
  loginIndividualService,
  requestIndividualPasswordResetService,
  requestCompanyPasswordResetService,
  resetIndividualPasswordService,
  resetCompanyPasswordService,
} from "../services/auth.service";
import { AppError } from "../middleware/errorHandler";
import { db as prisma } from "../config/database";

export const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required",
      });
    }

    const result = await registerAdminService(email, password, name);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const registerCompany = async (req: Request, res: Response) => {
  try {
    const { email, password, name, crNumber, phone, employeesLimit } = req.body;
    const crImage = req.file;

    if (!email || !password || !name || !crNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: "Email, password, name, CR number, and phone are required",
      });
    }

    const licenseImageUrl = crImage ? `/uploads/${crImage.filename}` : undefined;
    const limit = employeesLimit ? parseInt(employeesLimit) : 5;

    const result = await registerCompanyService(
      email,
      password,
      name,
      crNumber,
      phone,
      licenseImageUrl,
      limit
    );
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    console.error('Register company error:', error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const result = await loginAdminService(email, password);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const loginEmployee = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // البحث عن الموظف - نستخدم findFirst لأن email ليس unique منفرداً
    const employee = await prisma.companyEmployee.findFirst({
      where: { 
        email: email,
        isActive: true
      },
      include: { 
        company: true 
      }
    });

    if (!employee) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Check employee status
    // We allow 'pending' because newly created employees default to 'pending' but are isActive=true
    if (employee.status && (employee.status === 'blocked' || employee.status === 'rejected')) {
      return res.status(401).json({
        success: false,
        message: "Your account is " + employee.status + ". Please contact support."
      });
    }

    // التحقق من حالة الشركة
    if (employee.company.status !== 'approved') {
      return res.status(401).json({
        success: false,
        message: "Company is not approved yet"
      });
    }

    // التحقق من كلمة المرور
    const isPasswordValid = await bcrypt.compare(password, employee.passwordHash);    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }    // إنشاء JWT token
    const token = generateToken(
      { 
        employeeId: employee.id,
        companyId: employee.companyId,
        role: "employee",
        employeeRole: employee.role 
      },
      '24h'
    );

    res.json({
      success: true,
      message: "تم تسجيل الدخول بنجاح",
      data: {
        token,
        employee: {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          phone: employee.phone,
          role: employee.role,
          companyId: employee.companyId,
          company: {
            id: employee.company.id,
            name: employee.company.name,
            status: employee.company.status
          }
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
};

export const registerIndividual = async (req: Request, res: Response) => {
  try {
    const { fullName, email, phone, password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required" });
    }

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: "Email or phone is required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters" });
    }

    const result = await registerIndividualService({
      fullName,
      email,
      phone,
      password,
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const loginIndividual = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone, password } = req.body;
    const normalizedEmailOrPhone = String(emailOrPhone || '').trim();

    if (!normalizedEmailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "emailOrPhone and password are required",
      });
    }

    const result = await loginIndividualService({ emailOrPhone: normalizedEmailOrPhone, password });
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const forgotPasswordIndividual = async (req: Request, res: Response) => {
  try {
    const { emailOrPhone } = req.body;
    if (!emailOrPhone) {
      return res.status(400).json({ success: false, message: "emailOrPhone is required" });
    }

    const result = await requestIndividualPasswordResetService(String(emailOrPhone));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const forgotPasswordCompany = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const result = await requestCompanyPasswordResetService(String(email));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPasswordIndividual = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "token and newPassword are required" });
    }

    const result = await resetIndividualPasswordService(String(token), String(newPassword));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const resetPasswordCompany = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: "token and newPassword are required" });
    }

    const result = await resetCompanyPasswordService(String(token), String(newPassword));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const registerCompanyWithOwner = async (req: Request, res: Response) => {
  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      crNumber,
      ownerName,
      ownerEmail,
      ownerPhone,
      password
    } = req.body;

    // التحقق من البيانات المطلوبة
    if (!companyName || !companyEmail || !companyPhone || !crNumber || 
        !ownerName || !ownerEmail || !ownerPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "جميع البيانات مطلوبة"
      });
    }

    // التحقق أولاً من أن اسم الشركة غير مستخدم (بغض النظر عن الحالة)
    const existingByName = await prisma.company.findFirst({
      where: {
        name: {
          equals: companyName,
          mode: 'insensitive',
        },
      },
    });

    if (existingByName) {
      return res.status(400).json({
        success: false,
        message: "اسم الشركة مستخدم بالفعل، يرجى اختيار اسم مختلف"
      });
    }

    // التحقق من أن الشركة غير موجودة بالبريد أو السجل التجاري
    const existingCompany = await prisma.company.findFirst({
      where: {
        OR: [
          { email: companyEmail },
          { crNumber: crNumber },
        ],
      },
    });

    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: "الشركة موجودة بالفعل"
      });
    }

    // التحقق من أن البريد الإلكتروني للمالك غير موجود
    const existingEmployee = await prisma.companyEmployee.findFirst({
      where: { email: ownerEmail }
    });

    if (existingEmployee) {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني مستخدم بالفعل"
      });
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10);

    // معالجة صورة السجل التجاري
    const crImage = req.file;
    const licenseImageUrl = crImage ? `/uploads/${crImage.filename}` : null;

    // إنشاء الشركة والمالك في transaction
    const result = await prisma.$transaction(async (tx) => {
      // إنشاء الشركة
      const company = await tx.company.create({
        data: {
          name: companyName,
          email: companyEmail,
          phone: companyPhone,
          crNumber: crNumber,
          status: 'pending', // تحتاج موافقة الإدارة
          employeesLimit: 5,
          freeAdsRemaining: 3,
          featuredAdsBalance: 0,
          licenseImageUrl: licenseImageUrl
        }
      });

      // إنشاء المالك
      const owner = await tx.companyEmployee.create({
        data: {
          companyId: company.id,
          name: ownerName,
          email: ownerEmail,
          phone: ownerPhone,
          role: 'OWNER',
          passwordHash: hashedPassword,
          isActive: true
        }
      });

      return { company, owner };
    });

    res.status(201).json({
      success: true,
      message: "تم تسجيل الشركة بنجاح. سيتم مراجعتها من قبل الإدارة قريباً",
      data: {
        company: {
          id: result.company.id,
          name: result.company.name,
          status: result.company.status
        },
        owner: {
          id: result.owner.id,
          name: result.owner.name,
          email: result.owner.email
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم"
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Token is required",
      });
    }

    const decoded = await validateTokenService(token);

    // Issue a new token with the same payload
    const payload: Record<string, any> = {};
    if (typeof decoded === 'object' && decoded !== null) {
      const { iat, exp, ...rest } = decoded as Record<string, any>;
      Object.assign(payload, rest);
    }

    const newToken = generateToken(payload);

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: { token: newToken },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({
        success: false,
        message: error.message,
      });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
