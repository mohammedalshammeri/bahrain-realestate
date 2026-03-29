import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { upload } from "../middleware/upload";
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
  testData,
  logout,
  refreshToken,
} from "../controllers/auth.controller";

const router = Router();

// Employee login (main login for companies)
router.post("/login", loginEmployee);
router.post("/forgot-password", forgotPasswordCompany);
router.post("/reset-password", resetPasswordCompany);

// Individual auth
router.post("/individual/register", registerIndividual);
router.post("/individual/login", loginIndividual);
router.post("/individual/forgot-password", forgotPasswordIndividual);
router.post("/individual/reset-password", resetPasswordIndividual);

// Company registration with owner
router.post("/register", upload.single('crImage'), registerCompanyWithOwner);

// Admin routes
router.post("/admin/register", registerAdmin);
router.post("/admin/login", loginAdmin);

// Company registration route (old format)
router.post("/company/register", upload.single('crImage'), registerCompany);

// Test data route (development only)
router.get("/test-data", testData);

// Common routes
router.post("/logout", authMiddleware, logout);
router.post("/refresh-token", refreshToken);

export default router;
