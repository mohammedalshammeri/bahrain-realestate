import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { upload } from "../middleware/upload";
import { authLimiter } from "../middleware/rateLimiter";
import {
  registerAdmin,
  registerCompany,
  loginAdmin,
  loginEmployee,
  registerIndividual,
  loginIndividual,
  forgotPasswordIndividual,
  forgotPasswordCompany,
  resetPasswordIndividual,
  resetPasswordCompany,
  registerCompanyWithOwner,
  logout,
  refreshToken,
} from "../controllers/auth.controller";

const router = Router();

// Employee login (main login for companies)
router.post("/login", authLimiter, loginEmployee);
router.post("/forgot-password", authLimiter, forgotPasswordCompany);
router.post("/reset-password", authLimiter, resetPasswordCompany);

// Individual auth
router.post("/individual/register", authLimiter, registerIndividual);
router.post("/individual/login", authLimiter, loginIndividual);
router.post("/individual/forgot-password", authLimiter, forgotPasswordIndividual);
router.post("/individual/reset-password", authLimiter, resetPasswordIndividual);

// Company registration with owner
router.post("/register", authLimiter, upload.single('crImage'), registerCompanyWithOwner);

// Admin routes
router.post("/admin/register", authLimiter, registerAdmin);
router.post("/admin/login", authLimiter, loginAdmin);

// Company registration route (old format)
router.post("/company/register", authLimiter, upload.single('crImage'), registerCompany);

// Common routes
router.post("/logout", authMiddleware, logout);
router.post("/refresh-token", authLimiter, refreshToken);

export default router;
