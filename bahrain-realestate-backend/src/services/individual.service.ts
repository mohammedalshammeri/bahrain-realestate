import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";

const backendBase =
  process.env.BACKEND_PUBLIC_URL ||
  process.env.API_BASE_URL ||
  process.env.BASE_URL ||
  'http://localhost:8000';

const toAbsolute = (url?: string | null) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/')) return `${backendBase}${url}`;
  return `${backendBase}/${url}`;
};

export const getMyIndividualPropertiesService = async (individualId: number) => {
  try {
    const properties = await db.individualProperty.findMany({
      where: { ownerIndividualId: individualId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        type: true,
        purpose: true,
        minimumPrice: true,
        governorate: true,
        area: true,
        branch: true,
        bedrooms: true,
        bathrooms: true,
        areaSqm: true,
        furnishingStatus: true,
        floorsCount: true,
        floorNumber: true,
        livingRooms: true,
        buildingAge: true,
        negotiable: true,
        parkingCount: true,
        condition: true,
        showPhone: true,
        enableWhatsapp: true,
        status: true,
        adminRejectionReason: true,
        locationLat: true,
        locationLng: true,
        videoUrl: true,
        createdAt: true,
        updatedAt: true,
        images: {
          orderBy: [{ isCover: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            imageUrl: true,
            displayOrder: true,
            isCover: true,
          },
        },
        videos: {
          orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            videoUrl: true,
            displayOrder: true,
          },
        },
        offers: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            status: true,
            companyPrice: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      success: true,
      data: properties.map((p) => ({
        ...p,
        images: (p as any).images?.map((img: any) => ({
          ...img,
          imageUrl: toAbsolute(img.imageUrl),
        })) || [],
        videos: (p as any).videos?.map((vid: any) => ({
          ...vid,
          videoUrl: toAbsolute(vid.videoUrl),
        })) || [],
      })),
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get individual properties", 500);
  }
};

export const getMyIndividualProfileService = async (individualId: number) => {
  try {
    const user = await db.individualUser.findUnique({
      where: { id: individualId },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new AppError("User not found", 404);
    return { success: true, data: user };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get profile", 500);
  }
};

export const updateMyIndividualProfileService = async (
  individualId: number,
  data: { fullName?: string; phone?: string; profileImageUrl?: string }
) => {
  try {
    const exists = await db.individualUser.findUnique({ where: { id: individualId }, select: { id: true } });
    if (!exists) throw new AppError('User not found', 404);

    const updated = await db.individualUser.update({
      where: { id: individualId },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.profileImageUrl !== undefined ? { profileImageUrl: data.profileImageUrl } : {}),
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        profileImageUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: updated };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update profile', 500);
  }
};

export const createIndividualPropertyService = async (
  individualId: number,
  data: {
    status?: string;
    title?: string;
    description: string;
    type: string;
    purpose: string;
    minimumPrice: number;
    governorate: string;
    area: string;
    branch?: string;
    locationLat?: number;
    locationLng?: number;
    condition?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    furnishingStatus?: string;
    floorsCount?: number;
    floorNumber?: number;
    livingRooms?: number;
    buildingAge?: number;
    negotiable?: boolean;
    parkingCount?: number;
    showPhone?: boolean;
    enableWhatsapp?: boolean;
    videoUrl?: string | null;
  },
  images: Array<{ imageUrl: string; displayOrder: number; isCover: boolean }>,
  videos: Array<{ videoUrl: string; displayOrder: number }>
) => {
  try {
    const status = String(data.status || 'PENDING_ADMIN').toUpperCase();
    if (status !== 'DRAFT' && status !== 'PENDING_ADMIN') {
      throw new AppError('Invalid status', 400);
    }

    if (!data.description || !data.type || !data.purpose || !data.governorate || !data.area) {
      throw new AppError('Missing required fields', 400);
    }

    if (!Number.isFinite(data.minimumPrice) || data.minimumPrice < 0) {
      throw new AppError('minimumPrice must be a valid non-negative number', 400);
    }

    const numericFields: Array<[string, number | undefined]> = [
      ['bedrooms', data.bedrooms],
      ['bathrooms', data.bathrooms],
      ['areaSqm', data.areaSqm],
      ['floorsCount', data.floorsCount],
      ['floorNumber', data.floorNumber],
      ['livingRooms', data.livingRooms],
      ['buildingAge', data.buildingAge],
      ['parkingCount', data.parkingCount],
    ];

    for (const [label, value] of numericFields) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new AppError(`${label} must be a valid non-negative number`, 400);
      }
    }

    const created = await db.individualProperty.create({
      data: {
        ownerIndividualId: individualId,
        status: status as any,
        title: data.title || null,
        description: data.description,
        type: data.type,
        purpose: data.purpose as any,
        minimumPrice: data.minimumPrice as any,
        governorate: data.governorate,
        area: data.area,
        branch: data.branch || null,
        locationLat: data.locationLat !== undefined ? (data.locationLat as any) : null,
        locationLng: data.locationLng !== undefined ? (data.locationLng as any) : null,
        condition: data.condition || null,
        bedrooms: data.bedrooms !== undefined ? (data.bedrooms as any) : null,
        bathrooms: data.bathrooms !== undefined ? (data.bathrooms as any) : null,
        areaSqm: data.areaSqm !== undefined ? (data.areaSqm as any) : null,
        furnishingStatus: data.furnishingStatus || null,
        floorsCount: data.floorsCount !== undefined ? (data.floorsCount as any) : null,
        floorNumber: data.floorNumber !== undefined ? (data.floorNumber as any) : null,
        livingRooms: data.livingRooms !== undefined ? (data.livingRooms as any) : null,
        buildingAge: data.buildingAge !== undefined ? (data.buildingAge as any) : null,
        ...(data.negotiable !== undefined ? { negotiable: data.negotiable } : {}),
        parkingCount: data.parkingCount !== undefined ? (data.parkingCount as any) : null,
        ...(data.showPhone !== undefined ? { showPhone: data.showPhone } : {}),
        ...(data.enableWhatsapp !== undefined ? { enableWhatsapp: data.enableWhatsapp } : {}),
        videoUrl: data.videoUrl || null,
        images: {
          create: images.map((img) => ({
            imageUrl: img.imageUrl,
            displayOrder: img.displayOrder,
            isCover: img.isCover,
          })),
        },
        videos: videos.length
          ? {
              create: videos.map((vid) => ({
                videoUrl: vid.videoUrl,
                displayOrder: vid.displayOrder,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return { success: true, data: created, message: 'Property created' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to create individual property', 500);
  }
};

export const updateMyIndividualPropertyService = async (
  individualId: number,
  propertyId: number,
  data: {
    title?: string;
    description?: string;
    type?: string;
    purpose?: string;
    minimumPrice?: number;
    governorate?: string;
    area?: string;
    branch?: string;
    locationLat?: number;
    locationLng?: number;
    condition?: string;
    bedrooms?: number;
    bathrooms?: number;
    areaSqm?: number;
    furnishingStatus?: string;
    floorsCount?: number;
    floorNumber?: number;
    livingRooms?: number;
    buildingAge?: number;
    negotiable?: boolean;
    parkingCount?: number;
    showPhone?: boolean;
    enableWhatsapp?: boolean;
    videoUrl?: string | null;
  }
) => {
  try {
    const property = await db.individualProperty.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerIndividualId: true, status: true },
    });

    if (!property || property.ownerIndividualId !== individualId) {
      throw new AppError('Property not found', 404);
    }

    const status = String(property.status || '').toUpperCase();
    if (status !== 'DRAFT' && status !== 'REJECTED') {
      throw new AppError('Property cannot be edited in its current status', 400);
    }

    if (data.minimumPrice !== undefined) {
      if (!Number.isFinite(data.minimumPrice) || data.minimumPrice < 0) {
        throw new AppError('minimumPrice must be a valid non-negative number', 400);
      }
    }

    const numericFields: Array<[string, number | undefined]> = [
      ['bedrooms', data.bedrooms],
      ['bathrooms', data.bathrooms],
      ['areaSqm', data.areaSqm],
      ['floorsCount', data.floorsCount],
      ['floorNumber', data.floorNumber],
      ['livingRooms', data.livingRooms],
      ['buildingAge', data.buildingAge],
      ['parkingCount', data.parkingCount],
    ];

    for (const [label, value] of numericFields) {
      if (value !== undefined && (!Number.isFinite(value) || value < 0)) {
        throw new AppError(`${label} must be a valid non-negative number`, 400);
      }
    }

    const updated = await db.individualProperty.update({
      where: { id: propertyId },
      data: {
        ...(data.title !== undefined ? { title: data.title || null } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.type !== undefined ? { type: data.type } : {}),
        ...(data.purpose !== undefined ? { purpose: data.purpose as any } : {}),
        ...(data.minimumPrice !== undefined ? { minimumPrice: data.minimumPrice as any } : {}),
        ...(data.governorate !== undefined ? { governorate: data.governorate } : {}),
        ...(data.area !== undefined ? { area: data.area } : {}),
        ...(data.branch !== undefined ? { branch: data.branch || null } : {}),
        ...(data.locationLat !== undefined ? { locationLat: (data.locationLat as any) } : {}),
        ...(data.locationLng !== undefined ? { locationLng: (data.locationLng as any) } : {}),
        ...(data.condition !== undefined ? { condition: data.condition || null } : {}),
        ...(data.bedrooms !== undefined ? { bedrooms: (data.bedrooms as any) } : {}),
        ...(data.bathrooms !== undefined ? { bathrooms: (data.bathrooms as any) } : {}),
        ...(data.areaSqm !== undefined ? { areaSqm: (data.areaSqm as any) } : {}),
        ...(data.furnishingStatus !== undefined ? { furnishingStatus: data.furnishingStatus || null } : {}),
        ...(data.floorsCount !== undefined ? { floorsCount: (data.floorsCount as any) } : {}),
        ...(data.floorNumber !== undefined ? { floorNumber: (data.floorNumber as any) } : {}),
        ...(data.livingRooms !== undefined ? { livingRooms: (data.livingRooms as any) } : {}),
        ...(data.buildingAge !== undefined ? { buildingAge: (data.buildingAge as any) } : {}),
        ...(data.negotiable !== undefined ? { negotiable: data.negotiable } : {}),
        ...(data.parkingCount !== undefined ? { parkingCount: (data.parkingCount as any) } : {}),
        ...(data.showPhone !== undefined ? { showPhone: data.showPhone } : {}),
        ...(data.enableWhatsapp !== undefined ? { enableWhatsapp: data.enableWhatsapp } : {}),
        ...(data.videoUrl !== undefined ? { videoUrl: data.videoUrl } : {}),
      },
      select: { id: true, status: true, updatedAt: true },
    });

    return { success: true, data: updated, message: 'Property updated' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to update property', 500);
  }
};

export const submitMyIndividualPropertyService = async (
  individualId: number,
  propertyId: number
) => {
  try {
    const property = await db.individualProperty.findUnique({
      where: { id: propertyId },
      select: { id: true, ownerIndividualId: true, status: true },
    });

    if (!property || property.ownerIndividualId !== individualId) {
      throw new AppError('Property not found', 404);
    }

    const status = String(property.status || '').toUpperCase();
    if (status !== 'DRAFT' && status !== 'REJECTED') {
      throw new AppError('Only draft/rejected properties can be submitted', 400);
    }

    const updated = await db.individualProperty.update({
      where: { id: propertyId },
      data: { status: 'PENDING_ADMIN', adminRejectionReason: null },
      select: { id: true, status: true, updatedAt: true },
    });

    return { success: true, data: updated, message: 'Property submitted for review' };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError('Failed to submit property', 500);
  }
};
