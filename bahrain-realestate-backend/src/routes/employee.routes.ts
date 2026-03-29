import { Router } from "express";
import { 
  loginEmployeeController, 
  registerEmployeeController,
  deleteEmployeeController,
  updateEmployeeController,
  toggleEmployeeStatusController
} from "../controllers/employee.controller";
import { companyOwnerAuthMiddleware } from "../middleware/auth";

const router = Router();

// Public employee routes
router.post("/login", loginEmployeeController);

// Protected employee routes - registration requires owner
router.post("/register", companyOwnerAuthMiddleware, registerEmployeeController);

// Protected employee routes - delete/update require owner
router.delete("/:employeeId", companyOwnerAuthMiddleware, deleteEmployeeController);
router.patch("/:employeeId", companyOwnerAuthMiddleware, updateEmployeeController);
router.patch("/:employeeId/toggle", companyOwnerAuthMiddleware, toggleEmployeeStatusController);

export default router;
