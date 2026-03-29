import { Request, Response } from "express";
import {
  getAllPropertiesService,
  searchPropertiesService,
  getPropertyDetailsService,
  getAllGovernoratesService,
  getAllAreasService,
  getAreasByGovernorateService,
  createComplaintService,
  submitComplaintService,
  getAllCompaniesService,
  getCompanyByIdService,
} from "../services/public.service";
import { AppError } from "../middleware/errorHandler";

export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;

    const result = await getAllPropertiesService(skip, take);
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

export const searchPropertiesController = async (req: Request, res: Response) => {
  try {
    // Parse query parameters with proper validation
    const filters = {
      governorate: req.query.governorate as string,
      area: req.query.area as string,
      purpose: req.query.purpose as string,
      type: req.query.type as string,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
      bedrooms: req.query.bedrooms ? parseInt(req.query.bedrooms as string) : undefined,
      bathrooms: req.query.bathrooms ? parseInt(req.query.bathrooms as string) : undefined,
      isFeatured: req.query.isFeatured === 'true' ? true : req.query.isFeatured === 'false' ? false : undefined,
      isFeaturedPlus: req.query.isFeaturedPlus === 'true' ? true : req.query.isFeaturedPlus === 'false' ? false : undefined,
      skip: req.query.skip ? parseInt(req.query.skip as string) : 0,
      take: req.query.take ? parseInt(req.query.take as string) : 10,
      sortBy: (req.query.sortBy as 'price' | 'createdAt') || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    // Validate sort parameters
    if (filters.sortBy && !['price', 'createdAt'].includes(filters.sortBy)) {
      return res.status(400).json({
        success: false,
        message: "sortBy must be 'price' or 'createdAt'",
      });
    }

    if (filters.sortOrder && !['asc', 'desc'].includes(filters.sortOrder)) {
      return res.status(400).json({
        success: false,
        message: "sortOrder must be 'asc' or 'desc'",
      });
    }

    // Validate price range
    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
      return res.status(400).json({
        success: false,
        message: "minPrice cannot be greater than maxPrice",
      });
    }

    const result = await searchPropertiesService(filters);
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

// Alias for backward compatibility
export const searchProperties = searchPropertiesController;

export const getPropertyDetails = async (req: Request, res: Response) => {
  try {
    const { propertyId } = req.params;

    if (!propertyId) {
      return res.status(400).json({
        success: false,
        message: "Property ID is required",
      });
    }

    const result = await getPropertyDetailsService(parseInt(propertyId));
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

export const getAllGovernorates = async (req: Request, res: Response) => {
  try {
    const result = await getAllGovernoratesService();
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

export const getAllAreas = async (req: Request, res: Response) => {
  try {
    const result = await getAllAreasService();
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

export const getAreasByGovernorate = async (req: Request, res: Response) => {
  try {
    const { governorateId } = req.params;

    if (!governorateId) {
      return res.status(400).json({
        success: false,
        message: "Governorate ID is required",
      });
    }

    const result = await getAreasByGovernorateService(parseInt(governorateId));
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

export const createComplaint = async (req: Request, res: Response) => {
  try {
    console.log('[Complaints] createComplaint body', req.body);
    const { 
      companyId, 
      propertyId,
      submitterType, 
      userPhone, 
      userEmail, 
      userName,
      submitterCompanyId,
      submitterCompanyName,
      submitterCompanyEmail,
      submitterCompanyPhone,
      message 
    } = req.body;

    // Basic validation
    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Message is required",
      });
    }

    if (!submitterType || !['INDIVIDUAL', 'COMPANY'].includes(submitterType)) {
      return res.status(400).json({
        success: false,
        message: "Submitter type must be either INDIVIDUAL or COMPANY",
      });
    }

    const result = await createComplaintService({
      companyId: companyId ? parseInt(companyId) : null,
      propertyId: propertyId ? parseInt(propertyId) : null,
      submitterType,
      userPhone,
      userEmail,
      userName,
      submitterCompanyId: submitterCompanyId ? parseInt(submitterCompanyId) : undefined,
      submitterCompanyName,
      submitterCompanyEmail,
      submitterCompanyPhone,
      message,
    });

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

// Keep backward compatibility
export const submitComplaint = createComplaint;

export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const result = await getAllCompaniesService();
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

export const getCompanyById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      throw new AppError("Invalid company ID", 400);
    }
    const result = await getCompanyByIdService(id);
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
