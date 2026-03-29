import { Request, Response } from "express";
import { createPropertyImageService, deletePropertyImageService } from "../services/company.service";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const addPropertyImageController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.propertyId);
    const { imageUrl } = req.body;

    if (!companyId || !employeeId || !employeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
      });
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Image URL is required",
      });
    }

    const result = await createPropertyImageService(
      propertyId,
      imageUrl,
      employeeId,
      employeeRole,
      companyId
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

export const deletePropertyImageController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const imageId = parseInt(req.params.imageId);

    if (!companyId || !employeeId || !employeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!imageId) {
      return res.status(400).json({
        success: false,
        message: "Image ID is required",
      });
    }

    const result = await deletePropertyImageService(
      imageId,
      employeeId,
      employeeRole,
      companyId
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
