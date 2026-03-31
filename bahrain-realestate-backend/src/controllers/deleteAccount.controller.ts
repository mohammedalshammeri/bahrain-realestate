import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { AuthRequest } from "../../middleware/auth";
import { db as prisma } from "../../config/database";
import { AppError } from "../../middleware/errorHandler";

export const deleteIndividualAccountController = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const user = await prisma.individualUser.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Cascade delete handles properties and related data
    await prisma.individualUser.delete({
      where: { id: userId },
    });

    res.status(200).json({ success: true, message: "Account deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("Individual delete account error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const deleteCompanyAccountController = async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = req.user.id;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required" });
    }

    const employee = await prisma.companyEmployee.findUnique({
      where: { id: employeeId },
      include: { company: true },
    });

    if (!employee || employee.role !== 'owner') {
      return res.status(403).json({ success: false, message: "Only owners can delete the company account" });
    }

    const isMatch = await bcrypt.compare(password, employee.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Incorrect password" });
    }

    // Cascade delete handles properties, employees, and related data
    await prisma.company.delete({
      where: { id: employee.companyId },
    });

    res.status(200).json({ success: true, message: "Company account deleted successfully" });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    console.error("Company delete account error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
