import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import * as fs from "fs";
import * as path from "path";
import {
  getCompanyProfileService,
  updateCompanyProfileService,
  getCompanyPropertiesService,
  createPropertyService,
  updatePropertyService,
  deletePropertyService,
  getCompanyEmployeesService,
  registerEmployeeService,
  updateEmployeeService,
  deleteEmployeeService,
  toggleEmployeeStatusService,
  createPropertyImageService,
  deletePropertyImageService,
  featurePropertyService,
  getFeaturedAdsBalanceService,
  getCompanyComplaintsService,
  createPaymentTransactionService,
  updatePaymentSessionService,
  processAfsCallbackService,
  getCompanyNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
  createNotificationService,
  createFeaturedPackageService,
  getCompanyFeaturedPackagesService,
  cancelFeaturedPackageService,
  extendFeaturedPackageService,
  updatePropertyWithLocationService,
  respondToIndividualPropertyOfferService,
  getCompanyIndividualPropertyOffersService,
  getCompanyIndividualPropertyOfferByIdService,
  getCompanyPropertyByIdService,
  createSubscriptionRequestService,
  getCompanySubscriptionHistoryService,
} from "../services/company.service";
import { AppError } from "../middleware/errorHandler";

const coerceOptionalBoolean = (value: any): boolean | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return Boolean(value);
};

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyProfileService(companyId);
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

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { name, phone, licenseImageUrl } = req.body;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await updateCompanyProfileService(companyId, {
      name,
      phone,
      licenseImageUrl,
    });
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

export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const {
      title,
      type,
      purpose,
      price,
      governorate,
      area,
      branch,
      description,
      locationLat,
      locationLng,
      bedrooms,
      bathrooms,
      areaSqm,
      furnishingStatus,
      floorsCount,
      floorNumber,
      livingRooms,
      buildingAge,
      negotiable,
      parkingCount,
      condition,
      showPhone,
      enableWhatsapp,
    } = req.body;

    if (!type || !purpose || !price || !governorate || !area || !description) {
      return res.status(400).json({
        success: false,
        message:
          "Type, purpose, price, governorate, area, and description are required",
      });
    }

    const result = await createPropertyService(companyId, employeeId, {
      title: typeof title === 'string' ? title.trim() : undefined,
      type,
      purpose,
      price: parseFloat(price),
      governorate,
      area,
      branch,
      description,
      locationLat: locationLat ? parseFloat(locationLat) : undefined,
      locationLng: locationLng ? parseFloat(locationLng) : undefined,
      bedrooms: bedrooms ? parseInt(bedrooms) : undefined,
      bathrooms: bathrooms ? parseInt(bathrooms) : undefined,
      areaSqm: areaSqm ? parseInt(areaSqm) : undefined,
      furnishingStatus,
      floorsCount: floorsCount ? parseInt(floorsCount) : undefined,
      floorNumber: floorNumber ? parseInt(floorNumber) : undefined,
      livingRooms: livingRooms ? parseInt(livingRooms) : undefined,
      buildingAge: buildingAge ? parseInt(buildingAge) : undefined,
      negotiable: coerceOptionalBoolean(negotiable),
      parkingCount:
        parkingCount === undefined || parkingCount === null || parkingCount === ''
          ? undefined
          : parseInt(parkingCount),
      condition: typeof condition === 'string' ? condition.trim() : undefined,
      showPhone: coerceOptionalBoolean(showPhone),
      enableWhatsapp: coerceOptionalBoolean(enableWhatsapp),
    });

    // Handle uploaded files after property creation
    const rawFiles = req.files as any;
    const propertyId = result.data?.id;

    if (propertyId && rawFiles) {
      // Handle videos
      const videoFiles = Array.isArray(rawFiles?.videos) ? rawFiles.videos : [];
      
      if (videoFiles.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        for (const vf of videoFiles) {
          try {
            const fileUrl = `${baseUrl}/uploads/${vf.filename}`;
            await createPropertyImageService(propertyId, fileUrl, employeeId, req.user?.employeeRole || 'OWNER', companyId);
          } catch (createErr) {
            console.error('Error creating video record:', createErr);
          }
        }
      }

      // Handle images  
      const imageFiles = Array.isArray(rawFiles?.images) ? rawFiles.images : [];
      
      if (imageFiles.length > 0) {
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        for (const imgFile of imageFiles) {
          try {
            const fileUrl = `${baseUrl}/uploads/${imgFile.filename}`;
            await createPropertyImageService(propertyId, fileUrl, employeeId, req.user?.employeeRole || 'OWNER', companyId);
          } catch (createErr) {
            console.error('Error creating image record:', createErr);
          }
        }
      }
    }

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

export const getCompanyProperties = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const companyId = req.user?.companyId;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyPropertiesService(companyId, skip, take);
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

export const getCompanyProperty = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const propertyId = parseInt(req.params.id as string);

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!propertyId) {
      return res.status(400).json({ success: false, message: "Property ID is required" });
    }

    const result = await getCompanyPropertyByIdService(companyId, propertyId);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.id);
    const updateData = req.body;

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

    const normalizedUpdateData: any = { ...updateData };

    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'title') && typeof normalizedUpdateData.title === 'string') {
      normalizedUpdateData.title = normalizedUpdateData.title.trim();
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'condition') && typeof normalizedUpdateData.condition === 'string') {
      normalizedUpdateData.condition = normalizedUpdateData.condition.trim();
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'negotiable')) {
      normalizedUpdateData.negotiable = coerceOptionalBoolean(normalizedUpdateData.negotiable);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'showPhone')) {
      normalizedUpdateData.showPhone = coerceOptionalBoolean(normalizedUpdateData.showPhone);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'enableWhatsapp')) {
      normalizedUpdateData.enableWhatsapp = coerceOptionalBoolean(normalizedUpdateData.enableWhatsapp);
    }
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'parkingCount')) {
      const value = normalizedUpdateData.parkingCount;
      normalizedUpdateData.parkingCount =
        value === undefined || value === null || value === '' ? undefined : parseInt(value);
    }

    // Normalize status updates coming from company app (active/sold/rented)
    if (Object.prototype.hasOwnProperty.call(normalizedUpdateData, 'status')) {
      const rawStatus = String(normalizedUpdateData.status || '').toLowerCase();

      if (!['active', 'sold', 'rented'].includes(rawStatus)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status value. Allowed: active, sold, rented',
        });
      }

      // Prisma PropertyStatus يستخدم قيم صغيرة: active / sold / rented / ...
      normalizedUpdateData.status = rawStatus;
    }

    const result = await updatePropertyService(companyId, propertyId, employeeId, employeeRole, normalizedUpdateData);
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

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.id);

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

    const result = await deletePropertyService(companyId, propertyId, employeeId, employeeRole);
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

// List offers sent to this company for individual-submitted properties
export const getIndividualPropertyOffers = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const statusRaw = req.query.status as string | undefined;

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const normalizedStatus = statusRaw ? String(statusRaw).toUpperCase() : undefined;
    if (normalizedStatus && !['PENDING', 'ACCEPTED', 'REJECTED'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const result = await getCompanyIndividualPropertyOffersService(companyId, {
      status: normalizedStatus as 'PENDING' | 'ACCEPTED' | 'REJECTED' | undefined,
    });
    const normalizeUploadsUrl = (value: string) => {
      if (!value) return value;
      if (/^https?:\/\//i.test(value)) return value;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`;
    };

    const offers = (result.data || []).map((offer: any) => {
      const images = Array.isArray(offer.property?.images)
        ? offer.property.images
            .slice()
            .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
            .map((img: any) => normalizeUploadsUrl(img.imageUrl))
        : [];

      return {
        ...offer,
        property: offer.property
          ? {
              ...offer.property,
              images,
              videoUrl: offer.property.videoUrl ? normalizeUploadsUrl(offer.property.videoUrl) : null,
            }
          : offer.property,
      };
    });

    return res.status(200).json({ ...result, data: offers });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get a single offer (must belong to this company)
export const getIndividualPropertyOffer = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const offerId = parseInt(req.params.id);

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!offerId) {
      return res.status(400).json({ success: false, message: "Offer ID is required" });
    }

    const result = await getCompanyIndividualPropertyOfferByIdService(companyId, offerId);
    const normalizeUploadsUrl = (value: string) => {
      if (!value) return value;
      if (/^https?:\/\//i.test(value)) return value;
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return value.startsWith('/') ? `${baseUrl}${value}` : `${baseUrl}/${value}`;
    };

    const offer = result.data as any;
    const images = Array.isArray(offer?.property?.images)
      ? offer.property.images
          .slice()
          .sort((a: any, b: any) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((img: any) => normalizeUploadsUrl(img.imageUrl))
      : [];

    const normalized = offer?.property
      ? {
          ...offer,
          property: {
            ...offer.property,
            images,
            videoUrl: offer.property.videoUrl ? normalizeUploadsUrl(offer.property.videoUrl) : null,
          },
        }
      : offer;

    return res.status(200).json({ ...result, data: normalized });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Respond to an individual property offer (company marketing flow)
export const respondToIndividualPropertyOffer = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const offerId = parseInt(req.params.id);
    const { status, companyPrice } = req.body;

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!offerId) {
      return res.status(400).json({ success: false, message: "Offer ID is required" });
    }

    const normalizedStatus = String(status || '').toUpperCase();
    if (!['ACCEPTED', 'REJECTED'].includes(normalizedStatus)) {
      return res.status(400).json({ success: false, message: "Invalid status" });
    }

    const result = await respondToIndividualPropertyOfferService(companyId, offerId, {
      status: normalizedStatus as 'ACCEPTED' | 'REJECTED',
      companyPrice: companyPrice === undefined || companyPrice === null || companyPrice === '' ? undefined : Number(companyPrice),
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getCompanyEmployees = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyEmployeesService(companyId);
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

export const addEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { name, email, phone, role, password } = req.body;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!name || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: "Name, email, password, and role are required",
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

export const updateEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.id);
    const requestingEmployeeRole = req.user?.employeeRole;
    const updateData = req.body;

    if (!companyId || !requestingEmployeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await updateEmployeeService(
      companyId,
      employeeId,
      requestingEmployeeRole,
      updateData
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

export const deleteEmployee = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.id);
    const requestingEmployeeRole = req.user?.employeeRole;

    if (!companyId || !requestingEmployeeRole) {
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

export const toggleEmployeeStatus = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = parseInt(req.params.id);
    const requestingEmployeeRole = req.user?.employeeRole;

    if (!companyId || !requestingEmployeeRole) {
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

export const addPropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.propertyId);
    // Handle file uploads (support fields: images, videos)
    const rawFiles = req.files as any;
    
    // Debug log: write incoming upload details to uploads/upload-debug.log
    try {
      const logPath = path.join(process.cwd(), 'uploads', 'upload-debug.log');
      const incomingInfo: any = {
        timestamp: new Date().toISOString(),
        propertyId,
        companyId,
        employeeId,
        employeeRole,
        rawFilesKeys: rawFiles ? Object.keys(rawFiles) : [],
      };
      fs.appendFileSync(logPath, JSON.stringify({ event: 'addPropertyImage_incoming', info: incomingInfo }) + '\n');
    } catch (logErr) {
      // swallow logging errors
    }
    
    // STEP 2 - BACKEND: Log immediately in controller
    const uploadedFileGroups = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    console.log('VIDEOS RECEIVED (BACKEND):', uploadedFileGroups?.videos?.length || 0);
    console.log('IMAGES RECEIVED (BACKEND):', uploadedFileGroups?.images?.length || 0);
    console.log('FILES RECEIVED (BACKEND):', rawFiles ? Object.keys(rawFiles) : []);
    
    // Extract videos first. Instead of only setting a single `videoUrl` on the property,
    // STEP 3 - BACKEND: Treat req.files.videos as an array ALWAYS
    const videoFiles = uploadedFileGroups?.videos ? uploadedFileGroups.videos : [];
    
    // STEP 3 - BACKEND: Save ALL videos unconditionally
    console.log('PROCESSING VIDEOS:', videoFiles.length);
    
    // Enforce max 5 videos limit
    if (videoFiles.length > 5) {
      return res.status(400).json({
        success: false,
        message: "Maximum 5 videos allowed per property",
      });
    }
    
    const videoResults: any[] = [];
    if (videoFiles.length > 0) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      for (const vf of videoFiles) {
        const fileUrl = `${baseUrl}/uploads/${vf.filename}`;
        // STEP 3 - BACKEND: Save ALL videos using service that sets isVideo: true
        try {
          const vr = await createPropertyImageService(propertyId, fileUrl, employeeId, employeeRole, companyId);
          videoResults.push(vr);
          console.log('VIDEO SAVED:', vf.filename, 'ID:', vr?.data?.id || null);
          try {
            const logPath = path.join(process.cwd(), 'uploads', 'upload-debug.log');
            fs.appendFileSync(logPath, JSON.stringify({ event: 'video_processed', file: vf.filename, result: vr?.data?.id || null, timestamp: new Date().toISOString() }) + '\n');
          } catch {}
        } catch (createErr) {
          console.error('VIDEO SAVE ERROR:', vf.filename, createErr);
          try {
            const logPath = path.join(process.cwd(), 'uploads', 'upload-debug.log');
            fs.appendFileSync(logPath, JSON.stringify({ event: 'video_create_error', file: vf.filename, error: (createErr && (createErr as any).message) || createErr, timestamp: new Date().toISOString() }) + '\n');
          } catch {}
        }
      }
    }

    const files: Express.Multer.File[] = Array.isArray(rawFiles)
      ? rawFiles
      : [
          ...(Array.isArray(rawFiles?.images) ? rawFiles.images : []),
          // Exclude videos from "files" array processed below for property_images table
        ];
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

    const results = [...videoResults];

    // Case 1: Files uploaded via Multer
    if (files && files.length > 0) {
      // Construct base URL
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      for (const file of files) {
        // Construct full URL
        const fileUrl = `${baseUrl}/uploads/${file.filename}`;
        
        const result = await createPropertyImageService(
          propertyId,
          fileUrl,
          employeeId,
          employeeRole,
          companyId
        );
        results.push(result);
      }
    } 
    // Case 2: Image URL provided in body (legacy/direct URL)
    else if (imageUrl) {
      const result = await createPropertyImageService(
        propertyId,
        imageUrl,
        employeeId,
        employeeRole,
        companyId
      );
      results.push(result);
    } else {
      if (videoFiles.length > 0) {
        return res.status(200).json({
          success: true,
          message: "Video uploaded",
          data: [],
        });
      }
      return res.status(400).json({
        success: false,
        message: "No images provided",
      });
    }

    res.status(201).json({
      success: true,
      data: results.map(r => r.data),
      message: `${results.length} image(s) added successfully`
    });
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

export const deletePropertyImage = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
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

export const featureProperty = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.id);

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

    const result = await featurePropertyService(
      companyId,
      employeeId,
      employeeRole,
      propertyId
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

export const getFeaturedAdsBalance = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getFeaturedAdsBalanceService(companyId);
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

export const getCompanyComplaints = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 10;
    const status = req.query.status as string;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyComplaintsService(companyId, skip, take, status);
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

export const createPaymentRequest = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { packageType, amount } = req.body;

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!packageType || !amount) {
      return res.status(400).json({
        success: false,
        message: "packageType and amount are required",
      });
    }

    // Create PaymentTransaction record
    const result = await createPaymentTransactionService(companyId, packageType, amount);

    res.status(200).json({
      success: true,
      message: "Payment request initialized",
      data: result.data,
    });
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

// 2) Payment session (will call AFS later)
export const createPaymentSession = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { amount, transactionId } = req.body;

    if (!companyId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!amount || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Amount and transactionId are required",
      });
    }    // Update PaymentTransaction with real AFS session data
    const result = await updatePaymentSessionService(transactionId, amount);

    res.status(200).json({
      success: true,
      message: "AFS payment session created",
      data: {
        sessionId: result.data.sessionId,
        redirectUrl: result.redirectUrl,
        transaction: result.data,
      },
    });
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

// 3) AFS callback webhook (AFS will POST here after payment)
export const handleAfsCallback = async (req: Request, res: Response) => {
  try {
    const callbackData = req.body;
    
    // Extract fields safely from req.body
    const {
      sessionId,
      orderId,
      result,
      paymentId,
      authCode,
      status,
      amount,
      currency,
      date
    } = callbackData;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required",
      });
    }    // Create normalized paymentStatus
    const paymentStatus = (result === "Successful" || status === "success") ? "success" : "failed";
    
    // Process AFS callback and update PaymentTransaction
    const serviceResult = await processAfsCallbackService(paymentStatus, callbackData);

    res.status(200).json({
      success: true,
      message: "AFS callback processed successfully",
      data: {
        transactionId: serviceResult.data.transaction.id,
        status: serviceResult.data.transaction.status,
        processed: true,
      },
    });
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

// Phase 3: Notifications Controller Functions
export const getCompanyNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const skip = parseInt(req.query.skip as string) || 0;
    const take = parseInt(req.query.take as string) || 20;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyNotificationsService(companyId, skip, take);
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

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const notificationId = parseInt(req.params.id);

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!notificationId) {
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });
    }

    const result = await markNotificationAsReadService(companyId, notificationId);
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

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await markAllNotificationsAsReadService(companyId);
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

// Phase 3: Featured Packages Controller Functions
export const createFeaturedPackage = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const { propertyId, duration } = req.body;

    if (!companyId || !employeeId || !employeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!propertyId || !duration) {
      return res.status(400).json({
        success: false,
        message: "Property ID and duration are required",
      });
    }

    if (employeeRole !== 'admin' && employeeRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const result = await createFeaturedPackageService(propertyId, companyId, duration);
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

export const getCompanyFeaturedPackages = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanyFeaturedPackagesService(companyId);
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

export const cancelFeaturedPackage = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeRole = req.user?.employeeRole;
    const packageId = parseInt(req.params.id);

    if (!companyId || !employeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    if (employeeRole !== 'admin' && employeeRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const result = await cancelFeaturedPackageService(companyId, packageId);
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

export const extendFeaturedPackage = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeRole = req.user?.employeeRole;
    const packageId = parseInt(req.params.id);
    const { additionalDays } = req.body;

    if (!companyId || !employeeRole) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!packageId || !additionalDays) {
      return res.status(400).json({
        success: false,
        message: "Package ID and additional days are required",
      });
    }

    if (employeeRole !== 'admin' && employeeRole !== 'manager') {
      return res.status(403).json({
        success: false,
        message: "Insufficient permissions",
      });
    }

    const result = await extendFeaturedPackageService(companyId, packageId, additionalDays);
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

// Phase 3: Update property with location
export const updatePropertyWithLocation = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const employeeId = req.user?.employeeId || req.user?.id;
    const employeeRole = req.user?.employeeRole;
    const propertyId = parseInt(req.params.id);
    const updateData = req.body;

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

    const result = await updatePropertyWithLocationService(companyId, propertyId, employeeId, employeeRole, updateData);
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

export const createSubscriptionRequest = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const { packageId } = req.body;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required",
      });
    }

    const result = await createSubscriptionRequestService(companyId, Number(packageId));
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

export const getCompanySubscriptionHistory = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const result = await getCompanySubscriptionHistoryService(companyId);
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
