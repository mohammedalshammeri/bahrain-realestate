// Auth Service - Authentication logic
import { db } from "../config/database";
import { hashPassword, comparePassword } from "../utils/bcrypt";
import { generateToken, verifyToken } from "../config/jwt";
import { AppError } from "../middleware/errorHandler";
import { EmployeeStatus } from "@prisma/client";
import crypto from "crypto";
import { sendEmail } from "../utils/mailer";

const normalizeEmail = (value?: string) => (value ? value.trim().toLowerCase() : undefined);
const normalizePhone = (value?: string) => (value ? value.trim() : undefined);

const createResetToken = () => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, tokenHash };
};

export const registerAdminService = async (
  email: string,
  password: string,
  name: string
) => {
  try {
    // Check if admin already exists
    const existingAdmin = await db.admin.findUnique({
      where: { email },
    });

    if (existingAdmin) {
      throw new AppError("Email already registered", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);    // Create admin
    const admin = await db.admin.create({
      data: {
        name,
        email,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });

    // Generate token
    const token = generateToken(
      { id: admin.id, email: admin.email, role: admin.role },
      "7d"
    );

    return {
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Registration failed", 400);
  }
};

export const registerCompanyService = async (
  email: string,
  password: string,
  name: string,
  crNumber: string,
  phone: string,
  licenseImageUrl?: string,
  employeesLimit: number = 5
) => {
  try {
    // Check if company already exists by email
    const existingCompany = await db.company.findUnique({
      where: { email },
    });

    if (existingCompany) {
      throw new AppError("Email already registered", 409);
    }

    // Check if company name already exists (any status)
    const existingByName = await db.company.findFirst({
      where: {
        name: {
          equals: name,
          mode: 'insensitive',
        },
      },
    });

    if (existingByName) {
      throw new AppError("اسم الشركة مستخدم بالفعل، يرجى اختيار اسم مختلف", 409);
    }

    // Check if email is already used by any employee/owner
    const existingEmployee = await db.companyEmployee.findFirst({
      where: { email },
    });

    if (existingEmployee) {
      throw new AppError("Email already registered as an employee/owner", 409);
    }

    // Check if CR number already exists
    const existingCR = await db.company.findUnique({
      where: { crNumber },
    });

    if (existingCR) {
      throw new AppError("CR number already registered", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create company (without passwordHash)
    const company = await db.company.create({
      data: {
        name,
        email,
        crNumber,
        phone,
        licenseImageUrl,
        employeesLimit,
        status: "pending",
      },
    });

    // Create company owner employee
    const ownerEmployee = await db.companyEmployee.create({
      data: {
        companyId: company.id,
        name,
        email,
        phone,
        passwordHash,
        role: "OWNER",
        isActive: true,
        status: EmployeeStatus.active,
      },
    });

    // Generate token for company owner
    const token = generateToken(
      { id: ownerEmployee.id, email: ownerEmployee.email, companyId: company.id, role: "employee", employeeRole: "OWNER" },
      "7d"
    );

    return {
      success: true,
      data: {
        id: company.id,
        name: company.name,
        email: company.email,
        crNumber: company.crNumber,
        status: company.status,
        ownerRole: "OWNER",
        token,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Company registration failed", 400);
  }
};

export const loginAdminService = async (email: string, password: string) => {
  try {
    // Find admin by email
    const admin = await db.admin.findUnique({
      where: { email },
    });

    if (!admin) {
      throw new AppError("Invalid email or password", 401);
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, admin.passwordHash);

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(
      { id: admin.id, email: admin.email, role: admin.role },
      "7d"
    );

    return {
      success: true,
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        token,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Login failed", 401);
  }
};


export const loginEmployeeService = async (
  email: string,
  password: string,
  companyId: number
) => {
  try {
    // Check if company is approved
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    if (company.status !== "approved") {
      throw new AppError(
        `Company is ${company.status}. Please contact admin.`,
        403
      );
    }

    // Find employee by email and company ID
    const employee = await db.companyEmployee.findFirst({
      where: {
        email,
        companyId,
      },
    });

    if (!employee) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if employee is active
    if (!employee.isActive) {
      throw new AppError("Employee account is inactive", 403);
    }

    // Compare password
    const isPasswordValid = await comparePassword(
      password,
      employee.passwordHash
    );

    if (!isPasswordValid) {
      throw new AppError("Invalid email or password", 401);
    }

    // Generate token
    const token = generateToken(
      {
        id: employee.id,
        email: employee.email,
        companyId: employee.companyId,
        role: "employee",
        employeeRole: employee.role,
      },
      "7d"
    );

    return {
      success: true,
      data: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        companyId: employee.companyId,
        role: employee.role,
        isActive: employee.isActive,
        token,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Login failed", 401);
  }
};

export const registerIndividualService = async (data: {
  fullName?: string;
  email?: string;
  phone?: string;
  password: string;
}) => {
  try {
    const { fullName, email, phone, password } = data;
    const normalizedEmail = normalizeEmail(email);
    const normalizedPhone = normalizePhone(phone);

    if (!normalizedEmail && !normalizedPhone) {
      throw new AppError("Email or phone is required", 400);
    }

    if (normalizedEmail) {
      const existingEmail = await db.individualUser.findUnique({ where: { email: normalizedEmail } });
      if (existingEmail) throw new AppError("Email already registered", 409);
    }

    if (normalizedPhone) {
      const existingPhone = await db.individualUser.findUnique({ where: { phone: normalizedPhone } });
      if (existingPhone) throw new AppError("Phone already registered", 409);
    }

    const passwordHash = await hashPassword(password);

    const user = await db.individualUser.create({
      data: {
        fullName,
        email: normalizedEmail || null,
        phone: normalizedPhone || null,
        passwordHash,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    const token = generateToken(
      { role: "individual", individualId: user.id },
      "7d"
    );

    return { success: true, data: { user, token } };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Individual registration failed", 400);
  }
};

export const loginIndividualService = async (data: {
  emailOrPhone: string;
  password: string;
}) => {
  try {
    const { emailOrPhone, password } = data;
    const normalizedInput = emailOrPhone.trim();

    const user = await db.individualUser.findFirst({
      where: {
        OR: [
          { email: { equals: normalizeEmail(normalizedInput) || '', mode: 'insensitive' } },
          { phone: normalizePhone(normalizedInput) || '' },
        ],
      },
    });

    if (!user || !user.passwordHash) {
      throw new AppError("Invalid credentials", 401);
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError("Invalid credentials", 401);
    }

    const token = generateToken(
      { role: "individual", individualId: user.id },
      "7d"
    );

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          createdAt: user.createdAt,
        },
        token,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Login failed", 401);
  }
};

export const requestIndividualPasswordResetService = async (emailOrPhone: string) => {
  const normalizedInput = emailOrPhone.trim();
  const user = await db.individualUser.findFirst({
    where: {
      OR: [
        { email: { equals: normalizeEmail(normalizedInput) || '', mode: 'insensitive' } },
        { phone: normalizePhone(normalizedInput) || '' },
      ],
    },
  });

  if (!user) {
    return { success: true, message: "If the account exists, reset instructions will be sent." };
  }

  const { token, tokenHash } = createResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  await db.passwordReset.create({
    data: {
      userType: "INDIVIDUAL",
      individualUserId: user.id,
      email: user.email,
      phone: user.phone,
      tokenHash,
      expiresAt,
    },
  });

  if (user.email) {
    const subject = "Reset your password";
    const text = `Use this code to reset your password: ${token}`;
    const html = `<p>Use this code to reset your password:</p><p><b>${token}</b></p>`;
    await sendEmail({ to: user.email, subject, text, html });
  }

  return { success: true, message: "If the account exists, reset instructions will be sent." };
};

export const requestCompanyPasswordResetService = async (email: string) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    throw new AppError("Email is required", 400);
  }

  const employee = await db.companyEmployee.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  if (!employee) {
    return { success: true, message: "If the account exists, reset instructions will be sent." };
  }

  const { token, tokenHash } = createResetToken();
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  await db.passwordReset.create({
    data: {
      userType: "COMPANY_EMPLOYEE",
      companyEmployeeId: employee.id,
      email: employee.email,
      tokenHash,
      expiresAt,
    },
  });

  const subject = "Reset your password";
  const text = `Use this code to reset your password: ${token}`;
  const html = `<p>Use this code to reset your password:</p><p><b>${token}</b></p>`;
  await sendEmail({ to: employee.email, subject, text, html });

  return { success: true, message: "If the account exists, reset instructions will be sent." };
};

export const resetIndividualPasswordService = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await db.passwordReset.findFirst({
    where: {
      tokenHash,
      userType: "INDIVIDUAL",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record || !record.individualUserId) {
    throw new AppError("Invalid or expired token", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.individualUser.update({
    where: { id: record.individualUserId },
    data: { passwordHash },
  });

  await db.passwordReset.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { success: true, message: "Password reset successfully" };
};

export const resetCompanyPasswordService = async (token: string, newPassword: string) => {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const record = await db.passwordReset.findFirst({
    where: {
      tokenHash,
      userType: "COMPANY_EMPLOYEE",
      usedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!record || !record.companyEmployeeId) {
    throw new AppError("Invalid or expired token", 400);
  }

  const passwordHash = await hashPassword(newPassword);
  await db.companyEmployee.update({
    where: { id: record.companyEmployeeId },
    data: { passwordHash },
  });

  await db.passwordReset.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });

  return { success: true, message: "Password reset successfully" };
};

export const validateTokenService = async (token: string) => {
  try {
    const decoded = verifyToken(token);

    return {
      success: true,
      data: decoded,
    };
  } catch (error) {
    throw new AppError("Invalid or expired token", 401);
  }
};
