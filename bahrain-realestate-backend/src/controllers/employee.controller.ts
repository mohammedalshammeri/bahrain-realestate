import { Request, Response, NextFunction } from "express";
import { loginEmployeeService } from "../services/auth.service";
import { registerEmployeeService, deleteEmployeeService, updateEmployeeService, toggleEmployeeStatusService } from "../services/company.service";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const loginEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, companyId } = req.body;

    if (!email || !password || !companyId) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and company ID are required",
      });
    }

    const result = await loginEmployeeService(email, password, companyId);
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

export const registerEmployeeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { companyId, name, email, phone, role, password } = req.body;

    if (!companyId || !name || !email || !role || !password) {
      return res.status(400).json({
        success: false,
        message: "Company ID, name, email, role, and password are required",
      });
    }

    const result = await registerEmployeeService(
      companyId,
      name,
      email,
      phone,
      role,
      password
    );
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

export const deleteEmployeeController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.employeeId);
    const requestingEmployeeRole = req.user?.employeeRole;

    if (!companyId || !employeeId || !requestingEmployeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await deleteEmployeeService(
      companyId,
      employeeId,
      requestingEmployeeRole
    );
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

export const updateEmployeeController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.employeeId);
    const requestingEmployeeRole = req.user?.employeeRole;
    const { name, phone, role, isActive } = req.body;

    if (!companyId || !employeeId || !requestingEmployeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await updateEmployeeService(
      companyId,
      employeeId,
      requestingEmployeeRole,
      {
        name,
        phone,
        role,
        isActive,
      }
    );
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

export const toggleEmployeeStatusController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.employeeId);
    const requestingEmployeeRole = req.user?.employeeRole;

    if (!companyId || !employeeId || !requestingEmployeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await toggleEmployeeStatusService(
      companyId,
      employeeId,
      requestingEmployeeRole
    );
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
