import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import {
  createIndividualPropertyService,
  getMyIndividualPropertiesService,
  getMyIndividualProfileService,
  submitMyIndividualPropertyService,
  updateMyIndividualProfileService,
  updateMyIndividualPropertyService,
} from "../services/individual.service";

export const getMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;

    if (!individualId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getMyIndividualProfileService(Number(individualId));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const getMyProperties = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;

    if (!individualId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const result = await getMyIndividualPropertiesService(Number(individualId));
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

export const updateMyProfile = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;

    if (!individualId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const profileImage = (req as any).file as Express.Multer.File | undefined;
    const profileImageUrl = profileImage ? `/uploads/${profileImage.filename}` : undefined;

    const { fullName, phone } = req.body || {};

    const result = await updateMyIndividualProfileService(Number(individualId), {
      fullName,
      phone,
      ...(profileImageUrl ? { profileImageUrl } : {}),
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const createMyProperty = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;
    if (!individualId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const rawFiles = (req as any).files as any;
    // Extract videos
    const videoFiles: Express.Multer.File[] = Array.isArray(rawFiles?.videos) ? rawFiles.videos : [];
    const videoUrls = videoFiles.map((file) => `/uploads/${file.filename}`);
    const videoUrl = videoUrls.length > 0 ? videoUrls[0] : undefined;

    const files: Express.Multer.File[] = Array.isArray(rawFiles)
      ? rawFiles
      : [
          ...(Array.isArray(rawFiles?.images) ? rawFiles.images : []),
          // We handle videos formatting in "files" but createIndividualPropertyService logic only uses images array created below
          // Actually, let's keep logic simpler. The service param "images" expects parsed images.
          // We will pass videoUrl separately.
        ];
    const coverIndex = req.body?.coverIndex !== undefined ? Number(req.body.coverIndex) : 0;

    const parseOptionalNumber = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const parseOptionalBoolean = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      const normalized = String(value).toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
      return undefined;
    };

    const images = (files || []).map((file, idx) => ({
      imageUrl: `/uploads/${file.filename}`,
      displayOrder: idx,
      isCover: idx === coverIndex,
    }));

    const minimumPriceRaw = req.body?.minimumPrice;
    const minimumPrice = typeof minimumPriceRaw === 'string' ? Number(minimumPriceRaw) : Number(minimumPriceRaw);

    const locationLatRaw = req.body?.locationLat;
    const locationLngRaw = req.body?.locationLng;
    const locationLat = locationLatRaw !== undefined && locationLatRaw !== '' ? Number(locationLatRaw) : undefined;
    const locationLng = locationLngRaw !== undefined && locationLngRaw !== '' ? Number(locationLngRaw) : undefined;

    const bedrooms = parseOptionalNumber(req.body?.bedrooms);
    const bathrooms = parseOptionalNumber(req.body?.bathrooms);
    const areaSqm = parseOptionalNumber(req.body?.areaSqm);
    const furnishingStatus = req.body?.furnishingStatus as string | undefined;
    const floorsCount = parseOptionalNumber(req.body?.floorsCount);
    const floorNumber = parseOptionalNumber(req.body?.floorNumber);
    const livingRooms = parseOptionalNumber(req.body?.livingRooms);
    const buildingAge = parseOptionalNumber(req.body?.buildingAge);
    const parkingCount = parseOptionalNumber(req.body?.parkingCount);
    const negotiable = parseOptionalBoolean(req.body?.negotiable);
    const showPhone = parseOptionalBoolean(req.body?.showPhone);
    const enableWhatsapp = parseOptionalBoolean(req.body?.enableWhatsapp);

    const result = await createIndividualPropertyService(
      Number(individualId),
      {
        status: req.body?.status,
        title: req.body?.title,
        description: req.body?.description,
        type: req.body?.type,
        purpose: req.body?.purpose,
        minimumPrice,
        governorate: req.body?.governorate,
        area: req.body?.area,
        branch: req.body?.branch,
        condition: req.body?.condition,
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
        parkingCount,
        negotiable,
        showPhone,
        enableWhatsapp,
        videoUrl,
      },
      images,
      videoUrls.map((url, idx) => ({
        videoUrl: url,
        displayOrder: idx,
      }))
    );

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const updateMyProperty = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;
    const propertyId = Number(req.params.id);

    if (!individualId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!propertyId || Number.isNaN(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property id' });
    }

    const minimumPriceRaw = req.body?.minimumPrice;
    const minimumPrice = minimumPriceRaw !== undefined ? Number(minimumPriceRaw) : undefined;

    const locationLatRaw = req.body?.locationLat;
    const locationLngRaw = req.body?.locationLng;
    const locationLat = locationLatRaw !== undefined && locationLatRaw !== '' ? Number(locationLatRaw) : undefined;
    const locationLng = locationLngRaw !== undefined && locationLngRaw !== '' ? Number(locationLngRaw) : undefined;

    const parseOptionalNumber = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      const num = Number(value);
      return Number.isFinite(num) ? num : undefined;
    };

    const parseOptionalBoolean = (value: any) => {
      if (value === undefined || value === null || value === '') return undefined;
      if (typeof value === 'boolean') return value;
      const normalized = String(value).toLowerCase();
      if (['true', '1', 'yes', 'on'].includes(normalized)) return true;
      if (['false', '0', 'no', 'off'].includes(normalized)) return false;
      return undefined;
    };

    const bedrooms = parseOptionalNumber(req.body?.bedrooms);
    const bathrooms = parseOptionalNumber(req.body?.bathrooms);
    const areaSqm = parseOptionalNumber(req.body?.areaSqm);
    const furnishingStatus = req.body?.furnishingStatus as string | undefined;
    const floorsCount = parseOptionalNumber(req.body?.floorsCount);
    const floorNumber = parseOptionalNumber(req.body?.floorNumber);
    const livingRooms = parseOptionalNumber(req.body?.livingRooms);
    const buildingAge = parseOptionalNumber(req.body?.buildingAge);
    const parkingCount = parseOptionalNumber(req.body?.parkingCount);
    const negotiable = parseOptionalBoolean(req.body?.negotiable);
    const showPhone = parseOptionalBoolean(req.body?.showPhone);
    const enableWhatsapp = parseOptionalBoolean(req.body?.enableWhatsapp);

    const result = await updateMyIndividualPropertyService(Number(individualId), propertyId, {
      title: req.body?.title,
      description: req.body?.description,
      type: req.body?.type,
      purpose: req.body?.purpose,
      minimumPrice,
      governorate: req.body?.governorate,
      area: req.body?.area,
      branch: req.body?.branch,
      condition: req.body?.condition,
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
      parkingCount,
      negotiable,
      showPhone,
      enableWhatsapp,
    });

    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

export const submitMyProperty = async (req: AuthRequest, res: Response) => {
  try {
    const individualId = req.user?.individualId;
    const propertyId = Number(req.params.id);

    if (!individualId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    if (!propertyId || Number.isNaN(propertyId)) {
      return res.status(400).json({ success: false, message: 'Invalid property id' });
    }

    const result = await submitMyIndividualPropertyService(Number(individualId), propertyId);
    return res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};
