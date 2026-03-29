
import { Request, Response } from "express";
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";

// Get all packages (Public & Admin)
export const getAllPackages = async (req: Request, res: Response) => {
  try {
    // If admin requesting (check via route middleware/path), show all. 
    // If public, show only active.
    // simpler: pass ?active=true for public usage
    const onlyActive = req.query.active === 'true';

    const where = onlyActive ? { isActive: true } : {};

    const packages = await db.subscriptionPackage.findMany({
      where,
      orderBy: { price: 'asc' }
    });

    res.json({
      success: true,
      data: packages
    });
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch packages" });
  }
};

// Admin: Create Package
export const createPackage = async (req: Request, res: Response) => {
  try {
    const { 
      nameAr, nameEn, price, durationDays, 
      adsLimit, featuredAdsLimit, descriptionAr, descriptionEn 
    } = req.body;

    const newPackage = await db.subscriptionPackage.create({
      data: {
        nameAr,
        nameEn,
        price,
        durationDays: Number(durationDays),
        adsLimit: Number(adsLimit),
        featuredAdsLimit: Number(featuredAdsLimit),
        descriptionAr,
        descriptionEn,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      data: newPackage,
      message: "Package created successfully"
    });
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({ success: false, message: "Failed to create package" });
  }
};

// Admin: Update Package
export const updatePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedPackage = await db.subscriptionPackage.update({
      where: { id: Number(id) },
      data: {
        ...updateData,
        // Ensure numeric fields are converted if passed
        durationDays: updateData.durationDays ? Number(updateData.durationDays) : undefined,
        adsLimit: updateData.adsLimit ? Number(updateData.adsLimit) : undefined,
        featuredAdsLimit: updateData.featuredAdsLimit ? Number(updateData.featuredAdsLimit) : undefined,
        price: updateData.price ? Number(updateData.price) : undefined,
      }
    });

    res.json({
      success: true,
      data: updatedPackage,
      message: "Package updated successfully"
    });
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({ success: false, message: "Failed to update package" });
  }
};

// Admin: Delete (or Toggle Active)
export const deletePackage = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Hard delete or soft delete? 
    // Safer to just deactivate if used, but for now we'll do hard delete 
    // assuming no foreign keys block it yet (companies table just stores strings for plan name currently, 
    // but ideally should link to package ID. We will keep it flexible).
    
    await db.subscriptionPackage.delete({
      where: { id: Number(id) }
    });

    res.json({
      success: true,
      message: "Package deleted successfully"
    });
  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({ success: false, message: "Failed to delete package" });
  }
};
