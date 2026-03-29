import { Router } from "express";
import {
  getAllProperties,
  searchProperties,
  getPropertyDetails,
  getAllGovernorates,
  getAllAreas,
  getAreasByGovernorate,
  createComplaint,
  submitComplaint,
  getAllCompanies,
  getCompanyById,
} from "../controllers/public.controller";
import * as packagesController from "../controllers/packages.controller";

const router = Router();

// Public routes - accessible without authentication
router.get("/packages", packagesController.getAllPackages);
router.get("/properties", getAllProperties);
router.get("/search", searchProperties);
router.get("/properties/:propertyId", getPropertyDetails);

router.get("/governorates", getAllGovernorates);
router.get("/areas", getAllAreas); // Get all areas
router.get("/governorates/:governorateId/areas", getAreasByGovernorate);
router.get("/companies", getAllCompanies);
router.get("/companies/:id", getCompanyById);

router.post("/complaints", submitComplaint);

export default router;
