// Public Service - Public endpoints (no auth required)
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";

const backendBase =
  process.env.BACKEND_PUBLIC_URL ||
  process.env.API_BASE_URL ||
  process.env.BASE_URL ||
  'http://192.168.100.103:8000'; // updated to local IP for mobile access

const toAbsolute = (url?: string | null) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  
  // Normalize slashes for Windows compatibility
  const normalizedUrl = url.replace(/\\/g, '/');
  
  if (normalizedUrl.startsWith('/')) return `${backendBase}${normalizedUrl}`;
  return `${backendBase}/${normalizedUrl}`;
};

const mapAcceptedOfferToPublicProperty = (offer: any) => {
  const property = offer.property;
  const company = offer.company;

  const rawImages = (property as any)?.images || (property as any)?.propertyImages || [];

  const propertyImages = Array.isArray(rawImages)
    ? rawImages
        .slice()
        .sort((a: any, b: any) => {
          // Keep cover first, then displayOrder
          if (a.isCover && !b.isCover) return -1;
          if (!a.isCover && b.isCover) return 1;
          return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
        })
        .map((img: any) => ({
          id: img.id,
          propertyId: -Number(offer.id),
          imageUrl: toAbsolute(img.imageUrl),
          displayOrder: img.displayOrder ?? 0,
          isVideo: Boolean(img.isVideo),
        }))
    : [];

  return {
    id: -Number(offer.id),
    companyId: Number(company.id),
    createdByEmployeeId: 0,
    updatedByEmployeeId: null,
    title: property.title,
    type: property.type,
    purpose: property.purpose,
    price: offer.companyPrice?.toString?.() ?? String(offer.companyPrice),
    governorate: property.governorate,
    area: property.area,
    branch: property.branch,
    description: property.description,
    videoUrl: property.videoUrl ? toAbsolute(property.videoUrl) : null,
    locationLat: property.locationLat,
    locationLng: property.locationLng,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    areaSqm: property.areaSqm,
    furnishingStatus: property.furnishingStatus,
    floorsCount: property.floorsCount,
    floorNumber: property.floorNumber,
    livingRooms: property.livingRooms,
    buildingAge: property.buildingAge,
    negotiable: property.negotiable,
    parkingCount: property.parkingCount,
    condition: property.condition,
    showPhone: property.showPhone,
    enableWhatsapp: property.enableWhatsapp,
    isFeatured: false,
    status: "active",
    expiresAt: null,
    createdAt: offer.createdAt,
    updatedAt: offer.updatedAt,
    propertyImages,
    company: {
      id: company.id,
      name: company.name,
      email: company.email,
      phone: company.phone,
    },
  };
};

export const getAllPropertiesService = async (
  skip: number = 0,
  take: number = 10
) => {
  try {
    const takeWindow = skip + take;

    const [properties, acceptedOffers, totalCompanyProperties, totalAcceptedOffers] = await Promise.all([
      db.property.findMany({
        where: { status: "active" },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          propertyImages: {
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              imageUrl: true,
              displayOrder: true,
              isVideo: true
            },
          },
        },
        take: takeWindow,
        orderBy: { createdAt: "desc" },
      }),
      db.individualPropertyCompanyOffer.findMany({
        where: {
          status: 'ACCEPTED',
          companyPrice: { not: null },
          property: { status: 'ACTIVE' },
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            include: {
              images: {
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  displayOrder: true
                }
              },
            },
          },
        },
        take: takeWindow,
        orderBy: { createdAt: 'desc' },
      }),
      db.property.count({ where: { status: "active" } }),
      db.individualPropertyCompanyOffer.count({
        where: {
          status: 'ACCEPTED',
          companyPrice: { not: null },
          property: { status: 'ACTIVE' },
        },
      }),
    ]);

    const merged = [
      ...properties.map((p: any) => ({
        ...p,
        propertyImages: Array.isArray(p.propertyImages)
          ? p.propertyImages.map((img: any) => ({
              ...img,
              imageUrl: toAbsolute(img.imageUrl),
            }))
          : [],
      })),
      ...acceptedOffers.map(mapAcceptedOfferToPublicProperty),
    ].sort((a: any, b: any) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return bDate - aDate;
    });

    // Filter out expired properties (treat expired as not publicly active)
    const now = Date.now();
    const visibleItems = merged.filter((item: any) => {
      if (!item.expiresAt) return true;
      const ts = new Date(item.expiresAt).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts > now;
    });

    const pageItems = visibleItems.slice(skip, skip + take);
    const total = totalCompanyProperties + totalAcceptedOffers;

    return {
      success: true,
      data: pageItems,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    console.error("getAllPropertiesService error:", error);
    throw new AppError("Failed to get properties", 500);
  }
};

export const searchPropertiesService = async (
  filters: {
    governorate?: string;
    area?: string;
    purpose?: string;
    type?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
    bathrooms?: number;
    isFeatured?: boolean;
    isFeaturedPlus?: boolean;
    skip?: number;
    take?: number;
    sortBy?: 'price' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }
) => {
  try {
    const skip = filters.skip || 0;
    // Allow larger pages for public search (mobile listing may need >50)
    const take = Math.min(filters.take || 10, 200); // Limit max results per page
    const sortBy = filters.sortBy || 'createdAt';
    const sortOrder = filters.sortOrder || 'desc';

    const takeWindow = skip + take;

    // Build WHERE clause using Prisma AND logic
    const whereConditions: any[] = [
      { status: "active" }
    ];

    // Add filters to conditions array
    if (filters.governorate) {
      whereConditions.push({ governorate: filters.governorate });
    }

    if (filters.area) {
      whereConditions.push({ area: filters.area });
    }

    if (filters.purpose) {
      whereConditions.push({ purpose: filters.purpose });
    }

    if (filters.type) {
      whereConditions.push({ type: filters.type });
    }

    if (filters.isFeatured !== undefined) {
      whereConditions.push({ isFeatured: filters.isFeatured });
    }

    if (filters.isFeaturedPlus !== undefined) {
      whereConditions.push({ isFeaturedPlus: filters.isFeaturedPlus });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceCondition: any = {};
      if (filters.minPrice !== undefined) {
        priceCondition.gte = filters.minPrice.toString();
      }
      if (filters.maxPrice !== undefined) {
        priceCondition.lte = filters.maxPrice.toString();
      }
      whereConditions.push({ price: priceCondition });
    }

    if (filters.bedrooms !== undefined) {
      whereConditions.push({ bedrooms: filters.bedrooms });
    }

    if (filters.bathrooms !== undefined) {
      whereConditions.push({ bathrooms: filters.bathrooms });
    }

    const where = { AND: whereConditions };

    // Build orderBy
    const orderBy: any = {};
    if (sortBy === 'price') {
      orderBy.price = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    const [properties, totalCount, acceptedOffers, acceptedOffersCount] = await Promise.all([
      db.property.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          propertyImages: {
            orderBy: { displayOrder: "asc" },
            select: {
              id: true,
              imageUrl: true,
              displayOrder: true,
              isVideo: true
            }
          },
        },
        take: takeWindow,
        orderBy,
      }),
      db.property.count({ where }),
      db.individualPropertyCompanyOffer.findMany({
        where: {
          status: 'ACCEPTED',
          ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
            ? {
                companyPrice: {
                  ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
                  ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
                  not: null,
                },
              }
            : { companyPrice: { not: null } }),
          property: {
            status: 'ACTIVE',
            ...(filters.governorate ? { governorate: filters.governorate } : {}),
            ...(filters.area ? { area: filters.area } : {}),
            ...(filters.purpose ? { purpose: filters.purpose as any } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.bedrooms !== undefined ? { bedrooms: filters.bedrooms } : {}),
            ...(filters.bathrooms !== undefined ? { bathrooms: filters.bathrooms } : {}),
          },
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            include: {
              images: {
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  displayOrder: true
                }
              },
            },
          },
        },
        take: takeWindow,
        orderBy:
          sortBy === 'price'
            ? { companyPrice: sortOrder }
            : { createdAt: sortOrder },
      }),
      db.individualPropertyCompanyOffer.count({
        where: {
          status: 'ACCEPTED',
          ...(filters.minPrice !== undefined || filters.maxPrice !== undefined
            ? {
                companyPrice: {
                  ...(filters.minPrice !== undefined ? { gte: filters.minPrice } : {}),
                  ...(filters.maxPrice !== undefined ? { lte: filters.maxPrice } : {}),
                  not: null,
                },
              }
            : { companyPrice: { not: null } }),
          property: {
            status: 'ACTIVE',
            ...(filters.governorate ? { governorate: filters.governorate } : {}),
            ...(filters.area ? { area: filters.area } : {}),
            ...(filters.purpose ? { purpose: filters.purpose as any } : {}),
            ...(filters.type ? { type: filters.type } : {}),
            ...(filters.bedrooms !== undefined ? { bedrooms: filters.bedrooms } : {}),
            ...(filters.bathrooms !== undefined ? { bathrooms: filters.bathrooms } : {}),
          },
        },
      }),
    ]);

    const mergedItems = [
      ...properties.map((p: any) => ({
        ...p,
        propertyImages: Array.isArray(p.propertyImages)
          ? p.propertyImages.map((img: any) => ({
              ...img,
              imageUrl: toAbsolute(img.imageUrl),
            }))
          : [],
      })),
      ...acceptedOffers.map(mapAcceptedOfferToPublicProperty),
    ].sort((a: any, b: any) => {
      if (sortBy === 'price') {
        const aPrice = Number(a.price);
        const bPrice = Number(b.price);
        if (!Number.isFinite(aPrice) || !Number.isFinite(bPrice)) return 0;
        return sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
      }

      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? aDate - bDate : bDate - aDate;
    });

    // Filter out expired properties (treat expired as not publicly active)
    const nowTs = Date.now();
    const visibleItems = mergedItems.filter((item: any) => {
      if (!item.expiresAt) return true;
      const ts = new Date(item.expiresAt).getTime();
      if (!Number.isFinite(ts)) return true;
      return ts > nowTs;
    });

    const pageItems = visibleItems.slice(skip, skip + take);
    const combinedTotal = visibleItems.length;

    return {
      success: true,
      data: pageItems,
      totalCount: combinedTotal,
      skip,
      take,
      pagination: {
        total: combinedTotal,
        skip,
        take,
        pages: Math.ceil(combinedTotal / take),
      },
    };
  } catch (error) {
    console.error("searchPropertiesService error:", error);
    throw new AppError("Failed to search properties", 500);
  }
};

export const getPropertyDetailsService = async (propertyId: number) => {
  try {
    // Special case: accepted individual-property offer listings are exposed as negative IDs
    if (propertyId < 0) {
      const offerId = Math.abs(propertyId);
      const offer = await db.individualPropertyCompanyOffer.findUnique({
        where: { id: offerId },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          property: {
            include: {
              images: {
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
                select: {
                  id: true,
                  imageUrl: true,
                  displayOrder: true
                }
              },
            },
          },
        },
      });

      if (!offer) {
        throw new AppError("Property not found", 404);
      }

      if (offer.status !== 'ACCEPTED' || offer.companyPrice === null) {
        throw new AppError("Property is not published (no accepted company)", 404);
      }

      if (offer.property.status !== 'ACTIVE') {
        throw new AppError("Property is not published yet", 404);
      }

      return {
        success: true,
        data: mapAcceptedOfferToPublicProperty({
          ...offer,
          property: {
            ...offer.property,
            images: Array.isArray((offer.property as any)?.images)
              ? (offer.property as any).images.map((img: any) => ({
                  ...img,
                  imageUrl: toAbsolute(img.imageUrl),
                }))
              : [],
          },
        }),
      };
    }

    const property = await db.property.findUnique({
      where: { id: propertyId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        propertyImages: {
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            imageUrl: true,
            displayOrder: true,
            isVideo: true
          },
        },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.status !== "active") {
      throw new AppError("Property is not available", 404);
    }

    return {
      success: true,
      data: {
        ...property,
        videoUrl: property.videoUrl ? toAbsolute(property.videoUrl) : null,
        propertyImages: Array.isArray(property.propertyImages)
          ? property.propertyImages.map((img: any) => ({
              ...img,
              imageUrl: toAbsolute(img.imageUrl),
            }))
          : [],
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get property details", 500);
  }
};

export const getAllGovernoratesService = async () => {
  try {
    const governorates = await db.governorate.findMany({
      include: {
        areas: true,
      },
      orderBy: { nameEn: "asc" },
    });

    return {
      success: true,
      data: governorates,
    };
  } catch (error) {
    throw new AppError("Failed to get governorates", 500);
  }
};

export const getAllAreasService = async () => {
  try {
    const areas = await db.area.findMany({
      include: {
        governorate: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
      orderBy: { nameEn: "asc" },
    });

    return {
      success: true,
      data: areas,
    };
  } catch (error) {
    throw new AppError("Failed to get areas", 500);
  }
};

export const getAreasByGovernorateService = async (
  governorateId: number
) => {
  try {
    const areas = await db.area.findMany({
      where: { governorateId },
      orderBy: { nameEn: "asc" },
    });

    return {
      success: true,
      data: areas,
    };
  } catch (error) {
    throw new AppError("Failed to get areas", 500);
  }
};

export const createComplaintService = async (data: {
  companyId?: number | null;
  propertyId?: number | null;
  submitterType: 'INDIVIDUAL' | 'COMPANY';
  
  // Individual data
  userPhone?: string;
  userEmail?: string;
  userName?: string;
  
  // Company data
  submitterCompanyId?: number;
  submitterCompanyName?: string;
  submitterCompanyEmail?: string;
  submitterCompanyPhone?: string;
  
  message: string;
}) => {
  try {
    const normalizePhone = (value?: string) => {
      if (!value) return undefined;
      const trimmed = value.trim();
      if (!trimmed) return undefined;

      const arabicDigitMap: Record<string, string> = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
        '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
        '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
      };

      const normalized = trimmed
        .split('')
        .map((ch) => arabicDigitMap[ch] ?? ch)
        .join('')
        .replace(/[\s\-()]/g, '');

      return normalized;
    };

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
    } = data;

    const normalizedUserPhone = normalizePhone(userPhone);
    const normalizedCompanyPhone = normalizePhone(submitterCompanyPhone);

    // Validate required fields
    if (!message || message.trim().length === 0) {
      throw new AppError("Message is required", 400);
    }

    // Validation based on submitter type
    if (submitterType === 'INDIVIDUAL') {
      if (!normalizedUserPhone || normalizedUserPhone.length === 0) {
        throw new AppError("Phone number is required for individual complaints", 400);
      }
      
      const digitsOnly = normalizedUserPhone.replace(/\D/g, '');
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        throw new AppError("Invalid phone number format", 400);
      }
      
      // Validate email format if provided
      if (userEmail && userEmail.trim().length > 0) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userEmail.trim())) {
          throw new AppError("Invalid email format", 400);
        }
      }
    } else if (submitterType === 'COMPANY') {
      if (!submitterCompanyName || submitterCompanyName.trim().length === 0) {
        throw new AppError("Company name is required for company complaints", 400);
      }
      
      if (!submitterCompanyEmail || submitterCompanyEmail.trim().length === 0) {
        throw new AppError("Company email is required for company complaints", 400);
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(submitterCompanyEmail.trim())) {
        throw new AppError("Invalid email format", 400);
      }
    }

    // Validate message length
    if (message.trim().length < 10) {
      throw new AppError("Message must be at least 10 characters long", 400);
    }

    if (message.trim().length > 1000) {
      throw new AppError("Message cannot exceed 1000 characters", 400);
    }

    let finalMessage = message;
    let resolvedCompanyId = companyId ?? null;
    let resolvedPropertyId = propertyId ?? null;

    if (resolvedPropertyId) {
      if (resolvedPropertyId < 0) {
        // It's an Individual Property Offer
        const offerId = Math.abs(resolvedPropertyId);
        const offer = await db.individualPropertyCompanyOffer.findUnique({
          where: { id: offerId },
          include: { 
            company: true,
            property: true 
          },
        });

        if (!offer) {
          throw new AppError("Property offer not found", 404);
        }

        if (resolvedCompanyId && resolvedCompanyId !== offer.companyId) {
           // If a companyId was passed, verify it matches the offer's company
           throw new AppError("Property offer does not belong to the specified company", 400);
        }
        
        // Auto-resolve company from the offer
        resolvedCompanyId = offer.companyId;
        
        // Append context to message because we can't link to Property table (FK constraint)
        finalMessage = `[Regarding Offer #${offerId} for Individual Property: ${offer.property?.title || 'Unknown'}] \n${message}`;
        
        // Set propertyId to null effectively
        resolvedPropertyId = null;

      } else {
        // It's a standard Property
        const property = await db.property.findUnique({
          where: { id: resolvedPropertyId },
          select: { id: true, companyId: true },
        });

        if (!property) {
          throw new AppError("Property not found", 404);
        }

        if (resolvedCompanyId && resolvedCompanyId !== property.companyId) {
          throw new AppError("Property does not belong to company", 400);
        }

        resolvedCompanyId = property.companyId;
      }
    }

    // Verify target company exists (only if companyId is provided)
    if (resolvedCompanyId) {
      const company = await db.company.findUnique({
        where: { id: resolvedCompanyId },
        select: {
          id: true,
          name: true,
          status: true,
        },
      });

      if (!company) {
        throw new AppError("Company not found", 404);
      }
    }

    // If submitter is a company, verify it exists
    if (submitterType === 'COMPANY' && submitterCompanyId) {
      const submitterCompany = await db.company.findUnique({
        where: { id: submitterCompanyId },
        select: { id: true, status: true },
      });
      
      if (!submitterCompany) {
        throw new AppError("Submitter company not found", 404);
      }
    }

    // Create complaint
    const complaint = await db.complaint.create({
      data: {
        companyId: resolvedCompanyId || null,
        propertyId: resolvedPropertyId || null,
        submitterType,
        userPhone: submitterType === 'INDIVIDUAL' ? normalizedUserPhone : null,
        userEmail: submitterType === 'INDIVIDUAL' ? (userEmail?.trim() || null) : null,
        userName: submitterType === 'INDIVIDUAL' ? (userName?.trim() || null) : null,
        submitterCompanyId: submitterType === 'COMPANY' ? submitterCompanyId : null,
        submitterCompanyName: submitterType === 'COMPANY' ? submitterCompanyName?.trim() : null,
        submitterCompanyEmail: submitterType === 'COMPANY' ? submitterCompanyEmail?.trim() : null,
        submitterCompanyPhone: submitterType === 'COMPANY' ? normalizedCompanyPhone : null,
        message: finalMessage.trim(),
        status: "new",
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        submitterCompany: submitterType === 'COMPANY' ? {
          select: {
            id: true,
            name: true,
          }
        } : false,
      },
    });

    return {
      success: true,
      data: complaint,
      message: "Complaint submitted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to submit complaint", 500);
  }
};

// Keep backward compatibility
export const submitComplaintService = createComplaintService;

export const getAllCompaniesService = async () => {
  try {
    const companies = await db.company.findMany({
      where: {
        status: 'approved', // Only approved companies
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return {
      success: true,
      companies,
    };
  } catch (error) {
    throw new AppError("Failed to fetch companies", 500);
  }
};

export const getCompanyByIdService = async (id: number) => {
  try {
    const company = await db.company.findUnique({
      where: {
        id: id,
        status: 'approved',
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        // Add other relevant fields if needed, e.g., logo, address
      },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    return {
      success: true,
      company,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to fetch company details", 500);
  }
};
