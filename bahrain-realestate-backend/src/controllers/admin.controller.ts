import { Request, Response } from "express";
import { ComplaintStatus } from "@prisma/client";
import { generateToken } from "../config/jwt";
import { AppError } from "../middleware/errorHandler";
import { sendPushNotification } from "../services/push.service";
import bcrypt from 'bcrypt';
import { getSubscriptionRequestsService, updateSubscriptionRequestStatusService } from "../services/admin.service";
import { db as prisma } from "../config/database";

// Admin Login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required"
      });
    }

    // Check Database Admin (by Email)
    const dbAdmin = await prisma.admin.findUnique({
      where: { email: username }
    });

    if (dbAdmin) {
      const isPasswordValid = await bcrypt.compare(password, dbAdmin.passwordHash);
      
      if (isPasswordValid) {
        const token = generateToken({
          adminId: dbAdmin.id,
          role: dbAdmin.role,
          username: dbAdmin.email
        });

        return res.json({
          success: true,
          message: "تم تسجيل الدخول بنجاح",
          data: {
            token,
            admin: {
              id: dbAdmin.id,
              username: dbAdmin.email,
              name: dbAdmin.name,
              role: dbAdmin.role
            }
          }
        });
      }
    }

    return res.status(401).json({
      success: false,
      message: "بيانات الدخول غير صحيحة"
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في الخادم"
    });
  }
};

// Dashboard Statistics
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const [
      totalCompanies,
      pendingCompanies,
      approvedCompanies,
      rejectedCompanies,
      blockedCompanies,
      totalEmployees,
      totalProperties,
      activeProperties,
      featuredProperties,
      openComplaints,
      saleProperties,
      rentProperties
    ] = await Promise.all([
      prisma.company.count(),
      prisma.company.count({ where: { status: 'pending' } }),
      prisma.company.count({ where: { status: 'approved' } }),
      prisma.company.count({ where: { status: 'rejected' } }),
      prisma.company.count({ where: { status: 'blocked' } }),
      prisma.companyEmployee.count(),
      prisma.property.count(),
      prisma.property.count({ where: { status: 'active' } }),
      prisma.property.count({ where: { isFeatured: true } }),
      prisma.complaint.count({ where: { status: 'new' } }),
      prisma.property.count({ where: { purpose: 'sale' } }),
      prisma.property.count({ where: { purpose: 'rent' } })
    ]);

    // Recent activities
    const recentCompanies = await prisma.company.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        status: true,
        createdAt: true
      }
    });

    const recentProperties = await prisma.property.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    res.json({
      success: true,
      message: "تم جلب إحصائيات لوحة التحكم بنجاح",
      data: {
        statistics: {
          companies: {
            total: totalCompanies,
            pending: pendingCompanies,
            approved: approvedCompanies,
            rejected: rejectedCompanies,
            blocked: blockedCompanies
          },
          employees: {
            total: totalEmployees
          },
          properties: {
            total: totalProperties,
            active: activeProperties,
            featured: featuredProperties,
            sale: saleProperties,
            rent: rentProperties
          },
          complaints: {
            open: openComplaints
          }
        },
        recentActivities: {
          companies: recentCompanies,
          properties: recentProperties
        }
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الإحصائيات"
    });
  }
};

// Get All Companies
export const getAllCompanies = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { crNumber: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [companies, totalCount] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          employees: {
            select: {
              id: true,
              name: true,
              role: true,
              isActive: true
            }
          },
          _count: {
            select: {
              employees: true,
              properties: true
            }
          }
        }
      }),
      prisma.company.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب الشركات بنجاح",
      data: {
        companies,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الشركات"
    });
  }
};

// Update Company Status
export const updateCompanyStatus = async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id);
    const { status, reason } = req.body;

    if (!['pending', 'approved', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "حالة غير صالحة"
      });
    }

    const company = await prisma.company.update({
      where: { id: companyId },
      data: { status },
      include: {
        employees: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: `تم تحديث حالة الشركة إلى ${status}`,
      data: { 
        company,
        statusChangeReason: reason
      }
    });

  } catch (error) {
    console.error('Update company status error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث حالة الشركة"
    });
  }
};

// Delete Company
export const deleteCompany = async (req: Request, res: Response) => {
  try {
    const companyId = parseInt(req.params.id);

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      return res.status(404).json({
        success: false,
        message: "الشركة غير موجودة"
      });
    }

    // Use transaction to delete all related entities
    await prisma.$transaction(async (tx) => {
      // Delete property images first (depends on properties)
      await tx.propertyImage.deleteMany({ where: { property: { companyId } } });
      // Delete ads (depends on properties)
      await tx.ad.deleteMany({ where: { companyId } });
      // Delete complaints referencing this company
      await tx.complaint.deleteMany({ where: { companyId } });
      await tx.complaint.deleteMany({ where: { submitterCompanyId: companyId } });
      // Delete properties
      await tx.property.deleteMany({ where: { companyId } });
      // Delete individual property offers
      await tx.individualPropertyCompanyOffer.deleteMany({ where: { companyId } });
      // Delete subscription requests
      await tx.subscriptionRequest.deleteMany({ where: { companyId } });
      // Delete withdrawals
      await tx.withdrawal.deleteMany({ where: { companyId } });
      // Delete payments
      await tx.payment.deleteMany({ where: { companyId } });
      await tx.paymentTransaction.deleteMany({ where: { companyId } });
      // Delete password resets for employees
      await tx.passwordReset.deleteMany({ where: { companyEmployee: { companyId } } });
      // Delete employees
      await tx.companyEmployee.deleteMany({ where: { companyId } });
      // Finally delete the company
      await tx.company.delete({ where: { id: companyId } });
    });

    res.json({
      success: true,
      message: "تم حذف الشركة بنجاح"
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف الشركة"
    });
  }
};

// Get All Properties
export const getAllProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const purpose = req.query.purpose as string;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const governorate = req.query.governorate as string;
    const search = req.query.search as string;
    const dateFrom = req.query.dateFrom as string;
    const dateTo = req.query.dateTo as string;
    const sortParam = (req.query.sort as string) || 'desc';
    const companyParam = req.query.company as string;

    const skip = (page - 1) * limit;
    // FIX: Only fetch what we need for the current page, not accumulative
    const sortOrder: 'asc' | 'desc' = sortParam === 'asc' ? 'asc' : 'desc';

    const normalizedPurpose = typeof purpose === 'string' ? purpose.trim().toLowerCase() : undefined;
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : undefined;
    const normalizedType = typeof type === 'string' ? type.trim() : undefined;
    const normalizedGovernorate = typeof governorate === 'string' ? governorate.trim() : undefined;
    const companyId = companyParam ? parseInt(companyParam, 10) : undefined;

    // ===== FIX: Fetch all matching records to calculate correct total =====
    const buildGovernorateVariants = (value: string) => {
      const v = value.toLowerCase();
      const map: Record<string, string[]> = {
        capital: ['Capital', 'Capital Governorate', 'محافظة العاصمة', 'العاصمة'],
        muharraq: ['Muharraq', 'Muharraq Governorate', 'محافظة المحرق', 'المحرق'],
        northern: ['Northern', 'Northern Governorate', 'المحافظة الشمالية', 'الشمالية'],
        southern: ['Southern', 'Southern Governorate', 'المحافظة الجنوبية', 'الجنوبية']
      };
      return map[v] || [value];
    };

    const buildTypeVariants = (value: string) => {
      const normalized = value.trim();
      const underscore = normalized.replace(/\s+/g, '_').replace(/-/g, '_').toLowerCase();
      const spaced = normalized.replace(/_/g, ' ').toLowerCase();
      const slashed = normalized.replace(/_/g, '/').replace(/\s+/g, '/').toLowerCase();

      const typeAliases: Record<string, string[]> = {
        apartments: ['apartments', 'apartment', 'شقق', 'شقة'],
        villas_houses: ['villas/houses', 'villas houses', 'villa', 'house', 'villas', 'houses', 'فلل/بيوت', 'فلل', 'بيوت'],
        lands: ['lands', 'land', 'أراضي', 'أرض'],
        buildings: ['buildings', 'building', 'مباني', 'مبنى'],
        offices: ['offices', 'office', 'مكاتب', 'مكتب'],
        studio: ['studio', 'استوديو'],
        shops: ['shops', 'shop', 'محلات', 'محل'],
        warehouses: ['warehouses', 'warehouse', 'مستودعات', 'مستودع'],
        labor_accommodation: ['labor accommodation', 'labour accommodation', 'سكن عمال'],
        commercial_complexes: ['commercial complexes', 'commercial complex', 'مجمعات تجارية', 'مجمع تجاري'],
        chalets: ['chalets', 'chalet', 'شاليهات', 'شاليه'],
        traditional_houses: ['traditional houses', 'traditional house', 'بيوت شعبية', 'بيت شعبي'],
        farms: ['farms', 'farm', 'مزارع', 'مزرعة'],
        halls: ['halls', 'hall', 'قاعات', 'قاعة'],
        under_construction: ['under construction', 'under-construction', 'تحت الإنشاء'],
        camps: ['camps', 'camp', 'مخيمات', 'مخيم'],
        misc: ['misc', 'miscellaneous', 'متفرقات']
      };

      const aliases = typeAliases[underscore] || [];

      return Array.from(new Set([
        normalized.toLowerCase(),
        underscore,
        spaced,
        slashed,
        ...aliases
      ]));
    };

    // Build where clause
    const where: any = {};
    const andFilters: any[] = [];
    if (normalizedPurpose && normalizedPurpose !== 'all') where.purpose = normalizedPurpose;

    // Status handling (active/pending include expiry logic at DB level)
    if (normalizedStatus && normalizedStatus !== 'all') {
      const now = new Date();

      if (normalizedStatus === 'active') {
        // Active = status active AND not expired (expiresAt in the future)
        andFilters.push({
          status: 'active',
          expiresAt: { gt: now },
        });
      } else if (normalizedStatus === 'pending') {
        // Pending = real pending OR active but expired
        andFilters.push({
          OR: [
            { status: 'pending' },
            { status: 'active', expiresAt: { lte: now } },
          ],
        });
      } else {
        // Other statuses (rejected/sold/rented/...)
        where.status = normalizedStatus;
      }
    }
    if (companyId && !isNaN(companyId)) where.companyId = companyId;
    if (normalizedType && normalizedType !== 'all') {
      const variants = buildTypeVariants(normalizedType);
      andFilters.push({
        OR: variants.map((variant) => ({ type: { equals: variant, mode: 'insensitive' } }))
      });
    }
    if (normalizedGovernorate && normalizedGovernorate !== 'all') {
      const variants = buildGovernorateVariants(normalizedGovernorate);
      andFilters.push({
        OR: variants.map((variant) => ({ governorate: { contains: variant, mode: 'insensitive' } }))
      });
    }
    let dateWhereInput: any = {};
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom);
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999); // شمل كامل اليوم الأخير
      dateWhereInput = { createdAt: { gte: from, lte: to } };
      andFilters.push(dateWhereInput);
    } else if (dateFrom) {
      const from = new Date(dateFrom);
      dateWhereInput = { createdAt: { gte: from } };
      andFilters.push(dateWhereInput);
    } else if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      dateWhereInput = { createdAt: { lte: to } };
      andFilters.push(dateWhereInput);
    }
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const backendBase =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      'http://localhost:8000';

    const toAbsolute = (value: string) => {
      if (!value) return value;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      if (value.startsWith('/')) return `${backendBase}${value}`;
      return `${backendBase}/${value}`;
    };

    // Build filter for offers (which are always effectively 'ACTIVE')
    const offerPropertyWhere: any = {
      status: 'ACTIVE'
    };
    if (normalizedPurpose && normalizedPurpose !== 'all') offerPropertyWhere.purpose = normalizedPurpose;
    const offerAndFilters: any[] = [];
    if (normalizedType && normalizedType !== 'all') {
      const variants = buildTypeVariants(normalizedType);
      offerAndFilters.push({
        OR: variants.map((variant) => ({ type: { equals: variant, mode: 'insensitive' } }))
      });
    }
    if (normalizedGovernorate && normalizedGovernorate !== 'all') {
      const variants = buildGovernorateVariants(normalizedGovernorate);
      offerAndFilters.push({
        OR: variants.map((variant) => ({ governorate: { contains: variant, mode: 'insensitive' } }))
      });
    }
    if (search) {
      offerPropertyWhere.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (offerAndFilters.length > 0) {
      offerPropertyWhere.AND = offerAndFilters;
    }

    // Only fetch offers if we are looking for all/active statuses
    const shouldFetchOffers =
      !normalizedStatus ||
      normalizedStatus === 'all' ||
      normalizedStatus === 'active';

    // FIX: Fetch ALL matching records (without pagination) to merge and paginate correctly
    const [properties, totalCount] = await Promise.all([
      prisma.property.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          createdBy: {
            select: {
              name: true,
              role: true
            }
          },
          propertyImages: {
            orderBy: { displayOrder: 'asc' },
            select: {
              id: true,
              imageUrl: true,
              isVideo: true,
              displayOrder: true
            }
          }
        }
      }),
      prisma.property.count({ where }),
    ]);

    let acceptedOffers: any[] = [];
    let acceptedOffersCount = 0;

    if (shouldFetchOffers) {
      try {
        const [offers, offersCount] = await Promise.all([
          prisma.individualPropertyCompanyOffer.findMany({
            where: {
              status: 'ACCEPTED',
              companyPrice: { not: null },
              ...(companyId && !isNaN(companyId) ? { companyId } : {}),
              ...dateWhereInput,
              property: offerPropertyWhere,
            },
            include: {
              company: {
                select: { id: true, name: true, status: true }
              },
              property: {
                include: {
                  images: {
                    orderBy: [{ isCover: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
                  },
                },
              },
            },
            orderBy: { createdAt: sortOrder },
          }),
          prisma.individualPropertyCompanyOffer.count({
            where: {
              status: 'ACCEPTED',
              companyPrice: { not: null },
              ...(companyId && !isNaN(companyId) ? { companyId } : {}),
              ...dateWhereInput,
              property: offerPropertyWhere,
            },
          }),
        ]);

        acceptedOffers = offers;
        acceptedOffersCount = offersCount;
      } catch (offerError) {
        console.error('Get properties offers error:', offerError);
        acceptedOffers = [];
        acceptedOffersCount = 0;
      }
    }

    const mappedProperties = properties.map(p => {
      // Calculate remaining time if expiresAt is set
      let remainingTime = null;
      let isExpired = false;
      if (p.expiresAt) {
        const now = new Date();
        const expires = new Date(p.expiresAt);
        const diffMs = expires.getTime() - now.getTime();
        if (diffMs > 0) {
          // Calculate days, hours, minutes
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          remainingTime = { days, hours, minutes };
        } else {
          isExpired = true;
          remainingTime = { days: 0, hours: 0, minutes: 0 };
        }
      }
      return {
        ...p,
        images: p.propertyImages.map(img => toAbsolute(img.imageUrl)),
        propertyImages: p.propertyImages.map(img => ({
          ...img,
          imageUrl: toAbsolute(img.imageUrl)
        })),
        videoUrl: p.videoUrl ? toAbsolute(p.videoUrl) : null,
        source: 'COMPANY',
        remainingTime,
        isExpired,
      };
    });

    const mappedOffers = acceptedOffers.map((offer) => {
      const prop = offer.property as any;
      
      // Calculate remaining time for Individual Property
      let remainingTime = null;
      let isExpired = false;
      if (prop.expiresAt) {
        const now = new Date();
        const expires = new Date(prop.expiresAt);
        const diffMs = expires.getTime() - now.getTime();
        if (diffMs > 0) {
          const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          remainingTime = { days, hours, minutes };
        } else {
          isExpired = true;
          remainingTime = { days: 0, hours: 0, minutes: 0 };
        }
      }

      return {
        id: -Number(offer.id), // keep unique
        title: prop.title,
        description: prop.description,
        type: prop.type,
        purpose: prop.purpose,
        governorate: prop.governorate,
        area: prop.area,
        status: 'ACTIVE',
        price: Number(offer.companyPrice),
        companyId: offer.company?.id,
        company: offer.company,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        remainingTime,
        isExpired,
        videoUrl: prop?.videoUrl ? toAbsolute(prop.videoUrl) : null,
        images: Array.isArray((prop as any)?.images)
          ? (prop as any).images.map((img: any) => toAbsolute(img.imageUrl))
          : [],
        source: 'INDIVIDUAL_OFFER',
      } as any;
    });

    // Apply business rules on merged results (status, expiry, company)
    let filteredCombined = [...mappedProperties, ...mappedOffers];

    // If a specific company is selected, ensure we only keep
    // properties/offers that belong to that company
    if (companyId && !isNaN(companyId)) {
      filteredCombined = filteredCombined.filter((item: any) => item.companyId === companyId);
    }

    // Status is now fully handled at the database level (including expiry logic)
    // Sort combined results by createdAt according to requested order
    filteredCombined.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return sortOrder === 'asc' ? aTime - bTime : bTime - aTime;
    });
    
    // FIX: Apply pagination AFTER merging and sorting
    const totalFiltered = filteredCombined.length;
    const totalPages = Math.ceil(totalFiltered / limit);
    const paginatedResults = filteredCombined.slice(skip, skip + limit);

    res.json({
      success: true,
      message: "تم جلب العقارات بنجاح",
      data: {
        properties: paginatedResults,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount: totalFiltered,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });

  } catch (error: any) {
    console.error('Get properties error:', {
      message: error?.message,
      stack: error?.stack,
    });

    // Fallback: لا تكسر الواجهة، ارجع قائمة فاضية بدلاً من 500 في حال الخطأ غير معروف
    res.status(200).json({
      success: true,
      message: "تم جلب العقارات مع وجود خطأ داخلي مخفي",
      data: {
        properties: [],
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          limit: 10,
          hasNext: false,
          hasPrev: false
        }
      }
    });
  }
};

// Update Property Details (admin)
export const updatePropertyDetails = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const body = req.body || {};

    const updateData: any = {};

    if (typeof body.title === 'string') {
      updateData.title = body.title.trim();
    }
    if (typeof body.type === 'string') {
      updateData.type = body.type;
    }
    if (typeof body.purpose === 'string') {
      // Normalize purpose to lowercase values used in DB (sale/rent)
      const p = body.purpose.toLowerCase();
      updateData.purpose = p === 'rent' ? 'rent' : 'sale';
    }
    if (typeof body.price === 'number' && !Number.isNaN(body.price)) {
      updateData.price = body.price.toString();
    }
    if (typeof body.governorate === 'string') {
      updateData.governorate = body.governorate;
    }
    if (typeof body.area === 'string') {
      updateData.area = body.area;
    }
    if (typeof body.description === 'string') {
      updateData.description = body.description;
    }
    if (body.bedrooms !== undefined) {
      const parsed = Number(body.bedrooms);
      updateData.bedrooms = Number.isNaN(parsed) ? null : parsed;
    }
    if (body.bathrooms !== undefined) {
      const parsed = Number(body.bathrooms);
      updateData.bathrooms = Number.isNaN(parsed) ? null : parsed;
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided for update' });
    }

    const updated = await prisma.property.update({
      where: { id },
      data: updateData,
      include: {
        company: {
          select: { id: true, name: true, status: true },
        },
        createdBy: {
          select: { name: true, role: true },
        },
        propertyImages: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, imageUrl: true, isVideo: true, displayOrder: true },
        },
      },
    });

    const backendBase =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      'http://localhost:8000';

    const toAbsolute = (value: string) => {
      if (!value) return value;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      if (value.startsWith('/')) return `${backendBase}${value}`;
      return `${backendBase}/${value}`;
    };

    const mapped = {
      ...updated,
      images: updated.propertyImages.map((img) => toAbsolute(img.imageUrl)),
      propertyImages: updated.propertyImages.map((img) => ({
        ...img,
        imageUrl: toAbsolute(img.imageUrl),
      })),
      videoUrl: updated.videoUrl ? toAbsolute(updated.videoUrl) : null,
    };

    res.json({
      success: true,
      message: 'تم تحديث بيانات العقار بنجاح',
      data: mapped,
    });
  } catch (error) {
    console.error('Update property details error:', error);
    res.status(500).json({ success: false, message: 'Failed to update property details' });
  }
};

// Get Property By ID (admin)
export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const backendBase =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      'http://localhost:8000';

    const toAbsolute = (value: string) => {
      if (!value) return value;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      if (value.startsWith('/')) return `${backendBase}${value}`;
      return `${backendBase}/${value}`;
    };

    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, status: true } },
        createdBy: { select: { name: true, role: true } },
        propertyImages: { 
          orderBy: { displayOrder: 'asc' }, 
          select: { id: true, imageUrl: true, isVideo: true, displayOrder: true } 
        },
      },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Property not found' });
    }

    const mapped = {
      ...property,
      images: property.propertyImages.map(img => toAbsolute(img.imageUrl)),
      // Keep full propertyImages array for detailed access (e.g. video separation)
      propertyImages: property.propertyImages.map(img => ({
          ...img,
          imageUrl: toAbsolute(img.imageUrl)
      })),
      videoUrl: property.videoUrl ? toAbsolute(property.videoUrl) : null,
    };

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error('Get property by id error:', error);
    res.status(500).json({ success: false, message: 'Failed to get property' });
  }
};

// Get All Individual Properties (individual-submitted)
export const getAllIndividualProperties = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = (req.query.status as string) || 'all';
    const search = (req.query.search as string) || '';

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
        { governorate: { contains: search, mode: 'insensitive' } },
        { area: { contains: search, mode: 'insensitive' } },
        {
          owner: {
            OR: [
              { fullName: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const backendBase =
      process.env.BACKEND_PUBLIC_URL ||
      process.env.API_BASE_URL ||
      process.env.BASE_URL ||
      'http://localhost:8000';

    const normalizeUploadsUrl = (value: string) => {
      if (!value) return value;
      if (value.startsWith('http://') || value.startsWith('https://')) return value;
      if (value.startsWith('/')) return `${backendBase}${value}`;
      return `${backendBase}/${value}`;
    };

    const [properties, totalCount] = await Promise.all([
      prisma.individualProperty.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, fullName: true, email: true, phone: true } },
          images: {
            orderBy: [{ isCover: 'desc' }, { displayOrder: 'asc' }, { createdAt: 'asc' }],
            select: { imageUrl: true, isCover: true },
          },
          videos: {
            orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
            select: { videoUrl: true, displayOrder: true },
          },
          _count: { select: { offers: true } },
        },
      }),
      prisma.individualProperty.count({ where }),
    ]);

    const mapped = properties.map((p) => ({
      ...p,
      images: p.images.map((img) => normalizeUploadsUrl(img.imageUrl)),
      videoUrl: p.videoUrl ? normalizeUploadsUrl(p.videoUrl) : null,
      videos: (() => {
        const list = (p as any).videos?.map((vid: any) => normalizeUploadsUrl(vid.videoUrl)) || [];
        if (list.length > 0) return list;
        return p.videoUrl ? [normalizeUploadsUrl(p.videoUrl)] : [];
      })(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: 'تم جلب عقارات الأفراد بنجاح',
      data: {
        properties: mapped,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          limit,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    console.error('Get individual properties error:', error);
    res.status(500).json({ success: false, message: 'خطأ في جلب عقارات الأفراد' });
  }
};

// Reject Individual Property (admin)
export const rejectIndividualProperty = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const reason = String(req.body?.reason || '').trim();
    const forceReject = Boolean(req.body?.forceReject);

    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    if (!reason) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required' });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Individual property not found' });
    }

    const status = String(property.status || '').toUpperCase();

    if (status === 'ACTIVE' || status === 'SENT_TO_COMPANIES') {
      // If property already distributed/active, we allow rejection only if it doesn't have an accepted offer
      // OR if forceReject=true (admin override) which revokes offers to unpublish.
      const acceptedCount = await prisma.individualPropertyCompanyOffer.count({
        where: { propertyId: id, status: 'ACCEPTED' },
      });

      if (acceptedCount > 0 && !forceReject) {
        return res.status(400).json({
          success: false,
          message: 'Cannot reject after a company has accepted unless forceReject=true',
        });
      }

      if (forceReject) {
        await prisma.individualPropertyCompanyOffer.updateMany({
          where: { propertyId: id },
          data: { status: 'REJECTED' },
        });
      } else {
        // No accepted offers; safe to delete pending offers to remove from companies
        await prisma.individualPropertyCompanyOffer.deleteMany({
          where: { propertyId: id },
        });
      }
    } else if (status !== 'PENDING_ADMIN' && status !== 'REJECTED' && status !== 'DRAFT') {
      return res.status(400).json({ success: false, message: 'Property cannot be rejected in its current status' });
    }

    const updated = await prisma.individualProperty.update({
      where: { id },
      data: { status: 'REJECTED', adminRejectionReason: reason },
      select: { id: true, status: true, adminRejectionReason: true, updatedAt: true },
    });

    res.json({ success: true, message: 'تم رفض العقار', data: updated });
  } catch (error) {
    console.error('Reject individual property error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject individual property' });
  }
};

// Update Individual Property (admin)
export const updateIndividualProperty = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Individual property not found' });
    }

    // Admin edits are allowed before marketing is finished.
    // If ACTIVE, allow edits only to non-critical text fields (still ok for MVP).
    const status = String(property.status || '').toUpperCase();
    if (status !== 'PENDING_ADMIN' && status !== 'REJECTED' && status !== 'SENT_TO_COMPANIES' && status !== 'ACTIVE') {
      return res.status(400).json({ success: false, message: 'Property cannot be edited in its current status' });
    }

    const body = req.body || {};
    const data: any = {};

    if (body.title !== undefined) data.title = body.title ? String(body.title) : null;
    if (body.description !== undefined) data.description = String(body.description);
    if (body.type !== undefined) data.type = String(body.type);
    if (body.purpose !== undefined) data.purpose = String(body.purpose);
    if (body.minimumPrice !== undefined) {
      const mp = Number(body.minimumPrice);
      if (!Number.isFinite(mp) || mp < 0) {
        return res.status(400).json({ success: false, message: 'minimumPrice must be a valid non-negative number' });
      }
      data.minimumPrice = mp as any;
    }
    if (body.governorate !== undefined) data.governorate = String(body.governorate);
    if (body.area !== undefined) data.area = String(body.area);
    if (body.branch !== undefined) data.branch = body.branch ? String(body.branch) : null;
    if (body.locationLat !== undefined) data.locationLat = body.locationLat === null ? null : (Number(body.locationLat) as any);
    if (body.locationLng !== undefined) data.locationLng = body.locationLng === null ? null : (Number(body.locationLng) as any);
    if (body.condition !== undefined) data.condition = body.condition ? String(body.condition) : null;

    if (body.durationDays !== undefined) {
      const days = Number(body.durationDays);
      if (Number.isFinite(days) && days > 0) {
        data.durationDays = days;
        data.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
    }
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const updated = await prisma.individualProperty.update({
      where: { id },
      data,
      select: { id: true, title: true, minimumPrice: true, status: true, updatedAt: true },
    });

    res.json({ success: true, message: 'تم تحديث العقار', data: updated });
  } catch (error) {
    console.error('Update individual property error:', error);
    res.status(500).json({ success: false, message: 'Failed to update individual property' });
  }
};

// Reset Individual Property back to PENDING_ADMIN (admin) - removes offers and clears rejection reason
export const resetIndividualPropertyToPending = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Individual property not found' });
    }

    const acceptedCount = await prisma.individualPropertyCompanyOffer.count({
      where: { propertyId: id, status: 'ACCEPTED' },
    });
    if (acceptedCount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot reset while there is an accepted offer' });
    }

    await prisma.individualPropertyCompanyOffer.deleteMany({ where: { propertyId: id } });

    const updated = await prisma.individualProperty.update({
      where: { id },
      data: { status: 'PENDING_ADMIN', adminRejectionReason: null },
      select: { id: true, status: true, updatedAt: true },
    });

    res.json({ success: true, message: 'تمت إعادة الحالة إلى PENDING_ADMIN', data: updated });
  } catch (error) {
    console.error('Reset individual property error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset individual property' });
  }
};

// Mark Individual Property as Sold
export const getIndividualPropertyOffers = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const offers = await prisma.individualPropertyCompanyOffer.findMany({
      where: { propertyId: id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({ success: true, data: offers });
  } catch (error) {
    console.error('Get individual property offers error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get individual property offers' });
  }
};

export const markIndividualPropertyAsSold = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const rawOfferId = (req.body as any)?.offerId;
    const offerId = rawOfferId ? Number(rawOfferId) : undefined;

    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    if (rawOfferId !== undefined && (offerId === undefined || Number.isNaN(offerId) || offerId <= 0)) {
      return res.status(400).json({ success: false, message: 'Invalid offerId' });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
      select: { id: true, title: true, ownerIndividualId: true, status: true },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Individual property not found' });
    }

    const currentStatus = String(property.status || '').toUpperCase();
    if (currentStatus === 'SOLD') {
      return res.status(400).json({ success: false, message: 'Property is already marked as sold' });
    }

    let winningOffer: any | null = null;

    if (offerId) {
      winningOffer = await prisma.individualPropertyCompanyOffer.findUnique({
        where: { id: offerId },
        include: {
          company: { select: { id: true, name: true } },
        },
      });

      if (!winningOffer || winningOffer.propertyId !== id) {
        return res.status(400).json({ success: false, message: 'Offer not found for this property' });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      let updatedWinningOffer: any | null = null;

      if (offerId) {
        // Mark all other offers as REJECTED
        await tx.individualPropertyCompanyOffer.updateMany({
          where: { propertyId: id, id: { not: offerId } },
          data: { status: 'REJECTED' as any },
        });

        // Ensure the selected offer is ACCEPTED
        updatedWinningOffer = await tx.individualPropertyCompanyOffer.update({
          where: { id: offerId },
          data: { status: 'ACCEPTED' as any },
        });
      }

      const updatedProperty = await tx.individualProperty.update({
        where: { id },
        data: { status: 'SOLD' as any },
      });

      return { updatedProperty, updatedWinningOffer };
    });

    // Send push notification to owner (do not fail request if push fails)
    try {
      await sendPushNotification({
        title: 'تم بيع العقار',
        body: `مبروك! تم وضع علامة على عقارك "${property.title || 'بدون عنوان'}" كـ"تم البيع"`,
        userType: 'individual',
        userId: property.ownerIndividualId,
        data: {
          type: 'property_sold',
          propertyId: property.id,
        },
      });
    } catch (pushError) {
      console.warn('Push notification failed for sold property:', pushError);
    }

    res.json({
      success: true,
      message: 'تم وضع علامة البيع على العقار',
      data: {
        property: result.updatedProperty,
        winningOffer: result.updatedWinningOffer,
      },
    });
  } catch (error) {
    console.error('Mark property as sold error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark property as sold' });
  }
};

// Delete Individual Property
export const deleteIndividualProperty = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (!id) {
      return res.status(400).json({ success: false, message: 'Property ID is required' });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
    });

    if (!property) {
      return res.status(404).json({ success: false, message: 'Individual property not found' });
    }

    // Delete related offers first
    await prisma.individualPropertyCompanyOffer.deleteMany({
      where: { propertyId: id },
    });

    // Delete the property
    await prisma.individualProperty.delete({
      where: { id },
    });

    res.json({ success: true, message: 'تم حذف العقار بنجاح' });
  } catch (error) {
    console.error('Delete individual property error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete individual property' });
  }
};

// Update Property Status
export const updatePropertyStatus = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { status, durationDays, expiresAt } = req.body;

    if (!['active', 'pending', 'inactive', 'rejected', 'sold', 'rented'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "حالة غير صالحة"
      });
    }

    // Fetch property to check current expiry
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      return res.status(404).json({ success: false, message: "العقار غير موجود" });
    }

    // Calculate new expiresAt if provided
    let newExpiresAt = property.expiresAt;
    if (typeof durationDays === 'number' && durationDays > 0) {
      const now = new Date();
      newExpiresAt = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);
    } else if (expiresAt) {
      newExpiresAt = new Date(expiresAt);
    }

    // If property is being activated, set expiresAt if provided
    let updateData: any = { status };
    // Persist durationDays on the record if provided
    if (typeof durationDays === 'number' && durationDays > 0) {
      updateData.durationDays = durationDays;
    }
    if (status === 'active' && newExpiresAt) {
      updateData.expiresAt = newExpiresAt;
    }

    // If after update the expiry would already be in the past, set to pending
    if (status === 'active' && newExpiresAt && newExpiresAt <= new Date()) {
      updateData.status = 'pending';
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    // Notify company about status change
    if (['active', 'rejected'].includes(status)) {
      let title = "تحديث حالة العقار";
      let body = `تم تحديث حالة العقار "${updatedProperty.title || 'بدون عنوان'}" إلى ${status}`;
      
      if (status === 'active') {
        title = "تمت الموافقة على العقار";
        body = `مبروك! تمت الموافقة على عقارك "${updatedProperty.title || 'بدون عنوان'}" وهو الآن متاح للجمهور`;
      } else if (status === 'rejected') {
        title = "تم رفض العقار";
        body = `عذراً، تم رفض عقارك "${updatedProperty.title || 'بدون عنوان'}". يرجى المحاولة مرة أخرى أو التواصل معنا`;
      }

      sendPushNotification({
        title,
        body,
        userType: 'company',
        companyId: updatedProperty.companyId,
        data: {
          propertyId: updatedProperty.id,
          status: status,
          type: 'property_status_update'
        }
      }).catch(err => console.error('Failed to send status notification:', err));
    }

    res.json({
      success: true,
      message: `تم تحديث حالة العقار إلى ${updateData.status}`,
      data: updatedProperty
    });

  } catch (error) {
    console.error('Update property status error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث حالة العقار"
    });
  }
};

// Update Property Expiry
export const updatePropertyExpiry = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { days, hours, minutes } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "العقار غير موجود"
      });
    }

    const now = new Date();
    const addedTime = ((days || 0) * 24 * 60 * 60 * 1000) + 
                      ((hours || 0) * 60 * 60 * 1000) + 
                      ((minutes || 0) * 60 * 1000);
    
    if (addedTime <= 0) {
       return res.status(400).json({
        success: false,
        message: "يجب تحديد مدة صالحة (أكبر من صفر)"
      });
    }

    const newExpiresAt = new Date(now.getTime() + addedTime);

    // If extending duration, ensure property is active
    let status = property.status;
    if (['expired', 'rejected', 'pending'].includes(status)) {
         status = 'active';
    }

    const updatedProperty = await prisma.property.update({
      where: { id: propertyId },
      data: {
        expiresAt: newExpiresAt,
        status: status
      }
    });

    // Notify company
    sendPushNotification({
      title: "تحديث مدة العقار",
      body: `تم تحديث مدة صلاحية عقارك "${updatedProperty.title || 'بدون عنوان'}"`,
      userType: 'company',
      companyId: updatedProperty.companyId,
      data: {
        propertyId: updatedProperty.id,
        type: 'property_expiry_update'
      }
    }).catch(err => console.error('Failed to send expiry notification:', err));
    
    // Format remaining time for response
    const diffMs = newExpiresAt.getTime() - new Date().getTime();
    const rDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const rHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const rMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    res.json({
      success: true,
      message: "تم تحديث مدة العقار بنجاح",
      data: {
        ...updatedProperty,
        remainingTime: { days: rDays, hours: rHours, minutes: rMinutes }
      }
    });

  } catch (error) {
    console.error('Update property expiry error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث مدة العقار"
    });
  }
};

// Delete Property
export const deleteProperty = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);

    // HEADS UP: properties with negative IDs are actually IndividualPropertyCompanyOffer records
    // that are displayed mixed with regular properties.
    if (propertyId < 0) {
      const offerId = Math.abs(propertyId);
      
      const offer = await prisma.individualPropertyCompanyOffer.findUnique({
        where: { id: offerId }
      });

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "عرض الشركة غير موجود"
        });
      }

      await prisma.individualPropertyCompanyOffer.delete({
        where: { id: offerId }
      });

      return res.json({
        success: true,
        message: "تم حذف العرض (العقار) بنجاح"
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: "العقار غير موجود"
      });
    }

    // Manually delete related records first to avoid foreign key constraints issues
    await prisma.$transaction(async (tx) => {
      // 1. Delete associated ads
      await tx.ad.deleteMany({
        where: { propertyId: propertyId }
      });

      // 2. Delete property images
      await tx.propertyImage.deleteMany({
        where: { propertyId: propertyId }
      });

      // 3. Delete the property
      await tx.property.delete({
        where: { id: propertyId }
      });
    });

    res.json({
      success: true,
      message: "تم حذف العقار بنجاح"
    });

  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف العقار: " + (error instanceof Error ? error.message : "Internal Error")
    });
  }
};

// Distribute an individual-submitted property to companies (creates offers only; no public publish)
export const distributePropertyToCompanies = async (req: Request, res: Response) => {
  try {
    // Extra defense-in-depth: distribution must only be callable by admins
    if (!(req as any).admin) {
      return res.status(403).json({ success: false, message: "Admin only: distribution is not allowed for this role" });
    }

    const id = parseInt(req.params.id);
    const mode = String(req.body?.mode || '').toUpperCase();
    const companyId = req.body?.companyId !== undefined ? Number(req.body.companyId) : undefined;
    const companyIdsRaw = req.body?.companyIds;
    const companyIds = Array.isArray(companyIdsRaw)
      ? companyIdsRaw.map((v: any) => Number(v)).filter((n: number) => Number.isFinite(n))
      : undefined;

    if (!id) {
      return res.status(400).json({ success: false, message: "Property ID is required" });
    }

    if (mode !== 'ALL' && mode !== 'COMPANY' && mode !== 'COMPANIES') {
      return res.status(400).json({ success: false, message: "Invalid distribution mode" });
    }

    const property = await prisma.individualProperty.findUnique({
      where: { id },
      select: { id: true, status: true }
    });

    if (!property) {
      return res.status(404).json({ success: false, message: "Individual property not found" });
    }

    const status = String(property.status || '').toUpperCase();
    // Business rule:
    // - DRAFT: allow admin to start distribution (override missing submit)
    // - PENDING_ADMIN / REJECTED: ok (admin can start distribution)
    // - SENT_TO_COMPANIES: ok (admin can add more target companies later)
    // - ACTIVE: do not re-distribute here (handled via accepted offer flow)
    if (!['DRAFT', 'PENDING_ADMIN', 'REJECTED', 'SENT_TO_COMPANIES'].includes(status)) {
      return res.status(400).json({ success: false, message: "Property is not ready for distribution" });
    }

    let targetCompanyIds: number[] = [];

    if (mode === 'ALL') {
      const companies = await prisma.company.findMany({
        where: { status: 'approved' },
        select: { id: true }
      });
      targetCompanyIds = companies.map(c => c.id);
    } else if (mode === 'COMPANY') {
      if (!companyId || Number.isNaN(companyId)) {
        return res.status(400).json({ success: false, message: "companyId is required" });
      }
      const company = await prisma.company.findUnique({ where: { id: companyId }, select: { id: true, status: true } });
      if (!company) {
        return res.status(404).json({ success: false, message: "Company not found" });
      }
      if (company.status !== 'approved') {
        return res.status(400).json({ success: false, message: "Company must be approved" });
      }
      targetCompanyIds = [companyId];
    } else {
      // COMPANIES (multi-select)
      if (!companyIds || companyIds.length === 0) {
        return res.status(400).json({ success: false, message: "companyIds is required" });
      }

      const uniqueIds = Array.from(new Set(companyIds));
      const companies = await prisma.company.findMany({
        where: { id: { in: uniqueIds }, status: 'approved' },
        select: { id: true }
      });

      if (companies.length === 0) {
        return res.status(400).json({ success: false, message: "No approved target companies" });
      }

      targetCompanyIds = companies.map(c => c.id);
    }

    if (targetCompanyIds.length === 0) {
      return res.status(400).json({ success: false, message: "No target companies" });
    }

    const createResult = await prisma.individualPropertyCompanyOffer.createMany({
      data: targetCompanyIds.map(cid => ({
        companyId: cid,
        propertyId: id,
        status: 'PENDING'
      })),
      skipDuplicates: true
    });

    if (status !== 'SENT_TO_COMPANIES') {
      await prisma.individualProperty.update({
        where: { id },
        data: { status: 'SENT_TO_COMPANIES' }
      });
    }

    res.json({
      success: true,
      message: "Property distributed to companies",
      data: {
        createdOffers: createResult.count,
        mode,
        companiesCount: targetCompanyIds.length
      }
    });
  } catch (error) {
    console.error('Distribute property error:', error);
    res.status(500).json({ success: false, message: "Failed to distribute property" });
  }
};

// Get All Complaints
export const getAllComplaints = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const submitterType = req.query.submitterType as string;
    const search = req.query.search as string;
    const sort = (req.query.sort as string) || 'desc';
    const normalizedSort = sort === 'asc' ? 'asc' : 'desc';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    const normalizedStatus = typeof status === 'string' ? status.trim().toLowerCase() : undefined;
    const mappedStatus = normalizedStatus === 'closed' ? 'resolved' : normalizedStatus;
    if (mappedStatus && mappedStatus !== 'all') where.status = mappedStatus;
    if (submitterType && submitterType !== 'all') where.submitterType = submitterType.toUpperCase();
    if (search) {
      where.OR = [
        { message: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        { userPhone: { contains: search, mode: 'insensitive' } },
        { userName: { contains: search, mode: 'insensitive' } },
        { submitterCompanyName: { contains: search, mode: 'insensitive' } },
        { submitterCompanyEmail: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [complaints, totalCount] = await Promise.all([
      prisma.complaint.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: normalizedSort },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          property: {
            select: {
              id: true,
              title: true,
              purpose: true,
              governorate: true,
              area: true,
              price: true,
              companyId: true,
              propertyImages: {
                select: {
                  imageUrl: true,
                  displayOrder: true,
                  createdAt: true,
                  isVideo: true,
                },
                orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
              },
            }
          },
          submitterCompany: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.complaint.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب الشكاوى بنجاح",
      data: complaints,
      pagination: {
        page,
        totalPages,
        total: totalCount,
        limit
      }
    });

  } catch (error) {
    console.error('Get complaints error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الشكاوى"
    });
  }
};

// Update Complaint Status
export const updateComplaintStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "معرف الشكوى مطلوب"
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "حالة الشكوى مطلوبة"
      });
    }

    const normalizedStatus = String(status).toLowerCase();
    const mappedStatus = (normalizedStatus === 'closed' ? 'resolved' : normalizedStatus) as ComplaintStatus;

    // Valid complaint statuses (enum)
    const validStatuses = ['new', 'under_review', 'resolved'];
    if (!validStatuses.includes(mappedStatus)) {
      return res.status(400).json({
        success: false,
        message: "حالة الشكوى غير صالحة"
      });
    }

    const complaint = await prisma.complaint.update({
      where: { id: parseInt(id) },
      data: { 
        status: mappedStatus,
        adminNotes: notes || null
      },
      include: {
        company: {
          select: {
            id: true,
            name: true
          }
        },
        property: {
          select: {
            id: true,
            title: true,
            purpose: true,
            governorate: true,
            area: true,
            price: true,
            companyId: true,
            propertyImages: {
              select: {
                imageUrl: true,
                displayOrder: true,
                createdAt: true,
                isVideo: true,
              },
              orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
            },
          }
        }
      }
    });

    res.json({
      success: true,
      message: "تم تحديث حالة الشكوى بنجاح",
      data: complaint
    });

  } catch (error: any) {
    console.error('Update complaint status error:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: "الشكوى غير موجودة"
      });
    }
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث حالة الشكوى"
    });
  }
};

// Get All Employees
export const getAllEmployees = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (role && role !== 'all') where.role = role;
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [employees, totalCount] = await Promise.all([
      prisma.companyEmployee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.companyEmployee.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب الموظفين بنجاح",
      data: {
        employees,
        pagination: {
          page,
          totalPages,
          total: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الموظفين"
    });
  }
};

// Update Employee Status
export const updateEmployeeStatus = async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const { status } = req.body;

    if (!['pending', 'active', 'rejected', 'blocked'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "حالة غير صالحة"
      });
    }

    const employee = await prisma.companyEmployee.update({
      where: { id: employeeId },
      data: { 
        status,
        isActive: status === 'active'
      },
      include: {
        company: {
          select: { name: true }
        }
      }
    });

    res.json({
      success: true,
      message: `تم تحديث حالة الموظف إلى ${status}`,
      data: employee
    });

  } catch (error) {
    console.error('Update employee status error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث حالة الموظف"
    });
  }
};

// Get All Payments
export const getAllPayments = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') where.paymentStatus = status;
    if (search) {
      where.OR = [
        { transactionId: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [payments, totalCount] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.payment.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب المدفوعات بنجاح",
      data: {
        payments,
        pagination: {
          page,
          totalPages,
          total: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب المدفوعات"
    });
  }
};

// Get All Ads
export const getAllAds = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const type = req.query.type as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};

    // Soft delete: hide deleted ads by default
    if (!status || status === 'all') {
      where.status = { not: 'deleted' };
    }

    if (status && status !== 'all') {
      const normalizedStatus = String(status).toLowerCase();
      // Backward compatible aliases (older data used active/inactive)
      if (normalizedStatus === 'approved' || normalizedStatus === 'active') {
        where.status = { in: ['approved', 'active'] };
      } else if (normalizedStatus === 'rejected' || normalizedStatus === 'inactive') {
        where.status = { in: ['rejected', 'inactive'] };
      } else if (normalizedStatus === 'deleted') {
        where.status = 'deleted';
      } else {
        where.status = normalizedStatus;
      }
    }
    if (type && type !== 'all') where.type = type;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [ads, totalCount] = await Promise.all([
      prisma.ad.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          property: {
            select: {
              id: true,
              type: true,
              area: true
            }
          }
        }
      }),
      prisma.ad.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب الإعلانات بنجاح",
      data: {
        ads,
        pagination: {
          page,
          totalPages,
          total: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get ads error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الإعلانات"
    });
  }
};

// Get Ad By ID
export const getAdById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ad = await prisma.ad.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, email: true, phone: true } },
        property: { select: { id: true, description: true, price: true, propertyImages: true } }
      }
    });

    if (!ad) {
      return res.status(404).json({ success: false, message: "الإعلان غير موجود" });
    }

    res.json({ success: true, data: ad });
  } catch (error) {
    console.error('Get ad by id error:', error);
    res.status(500).json({ success: false, message: "خطأ في جلب الإعلان" });
  }
};

// Approve Ad
export const approveAd = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const ad = await prisma.ad.update({
      where: { id },
      data: { status: 'approved', rejectionReason: null }
    });
    res.json({ success: true, message: "تمت الموافقة على الإعلان", data: ad });
  } catch (error) {
    console.error('Approve ad error:', error);
    res.status(500).json({ success: false, message: "خطأ في الموافقة على الإعلان" });
  }
};

// Reject Ad
export const rejectAd = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const rawReason = req.body?.reason;
    const reason = typeof rawReason === 'string' ? rawReason.trim() : '';

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: "سبب الرفض مطلوب"
      });
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason }
    });
    res.json({ success: true, message: "تم رفض الإعلان", data: ad });
  } catch (error) {
    console.error('Reject ad error:', error);
    res.status(500).json({ success: false, message: "خطأ في رفض الإعلان" });
  }
};

// Set / Unset Featured Ad
export const setAdFeatured = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const featured = Boolean(req.body?.featured);

    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "الإعلان غير موجود" });
    }

    if (featured) {
      const normalizedStatus = String(existing.status || '').toLowerCase();
      // Only allow featuring approved/active ads
      if (normalizedStatus !== 'approved' && normalizedStatus !== 'active') {
        return res.status(400).json({
          success: false,
          message: "لا يمكن تمييز الإعلان كـ Featured إلا بعد الموافقة عليه"
        });
      }
    }

    const ad = await prisma.ad.update({
      where: { id },
      data: {
        type: featured ? 'featured' : 'regular',
        isFeatured: featured
      }
    });

    res.json({
      success: true,
      message: featured ? "تم تعيين الإعلان كـ Featured" : "تم إلغاء Featured عن الإعلان",
      data: ad
    });
  } catch (error) {
    console.error('Set ad featured error:', error);
    res.status(500).json({ success: false, message: "خطأ في تحديث حالة Featured" });
  }
};

// Update Ad (Admin edit)
export const updateAd = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const data: any = {};

    if (typeof req.body?.title === 'string') {
      const title = req.body.title.trim();
      if (!title) {
        return res.status(400).json({ success: false, message: "عنوان الإعلان مطلوب" });
      }
      data.title = title;
    }

    if (typeof req.body?.description === 'string') {
      const description = req.body.description.trim();
      if (!description) {
        return res.status(400).json({ success: false, message: "وصف الإعلان مطلوب" });
      }
      data.description = description;
    }

    if (req.body?.startDate !== undefined) {
      const startDate = new Date(req.body.startDate);
      if (Number.isNaN(startDate.getTime())) {
        return res.status(400).json({ success: false, message: "تاريخ بداية غير صالح" });
      }
      data.startDate = startDate;
    }

    if (req.body?.endDate !== undefined) {
      const endDate = new Date(req.body.endDate);
      if (Number.isNaN(endDate.getTime())) {
        return res.status(400).json({ success: false, message: "تاريخ نهاية غير صالح" });
      }
      data.endDate = endDate;
    }

    if (data.startDate && data.endDate && data.endDate <= data.startDate) {
      return res.status(400).json({ success: false, message: "تاريخ النهاية يجب أن يكون بعد تاريخ البداية" });
    }

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, message: "لا توجد بيانات للتحديث" });
    }

    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "الإعلان غير موجود" });
    }
    if (String(existing.status || '').toLowerCase() === 'deleted') {
      return res.status(400).json({ success: false, message: "لا يمكن تعديل إعلان محذوف" });
    }

    const ad = await prisma.ad.update({
      where: { id },
      data
    });

    res.json({ success: true, message: "تم تحديث الإعلان", data: ad });
  } catch (error) {
    console.error('Update ad error:', error);
    res.status(500).json({ success: false, message: "خطأ في تحديث الإعلان" });
  }
};

// Delete Ad
export const deleteAd = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const existing = await prisma.ad.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: "الإعلان غير موجود" });
    }

    if (String(existing.status || '').toLowerCase() === 'deleted') {
      return res.json({ success: true, message: "الإعلان محذوف بالفعل" });
    }

    await prisma.ad.update({
      where: { id },
      data: { status: 'deleted', isDeleted: true }
    });

    res.json({ success: true, message: "تم أرشفة الإعلان (حذف مؤقت)" });
  } catch (error) {
    console.error('Delete ad error:', error);
    res.status(500).json({ success: false, message: "خطأ في حذف الإعلان" });
  }
};

// Get All System Employees (Admins)
export const getAllSystemEmployees = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [admins, totalCount] = await Promise.all([
      prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.admin.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب مدراء النظام بنجاح",
      data: {
        employees: admins,
        pagination: {
          page,
          totalPages,
          total: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get system employees error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب مدراء النظام"
    });
  }
};

// Create System Employee
export const createSystemEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "جميع الحقول مطلوبة"
      });
    }

    // Check if email exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { email }
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: "البريد الإلكتروني مسجل مسبقاً"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword,
        role: role || 'ADMIN'
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({
      success: true,
      message: "تم إنشاء حساب المدير بنجاح",
      data: newAdmin
    });

  } catch (error) {
    console.error('Create system employee error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في إنشاء حساب المدير"
    });
  }
};

// Update System Employee
export const updateSystemEmployee = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, password, role } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { id }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "المدير غير موجود"
      });
    }

    const updateData: any = {
      name,
      email,
      role
    };

    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 10);
    }

    const updatedAdmin = await prisma.admin.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      message: "تم تحديث بيانات المدير بنجاح",
      data: updatedAdmin
    });

  } catch (error) {
    console.error('Update system employee error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث بيانات المدير"
    });
  }
};

// Delete System Employee
export const deleteSystemEmployee = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const admin = await prisma.admin.findUnique({
      where: { id }
    });

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "المدير غير موجود"
      });
    }

    // Prevent deleting the last super admin
    if (admin.role === 'SUPER_ADMIN') {
      const superAdminCount = await prisma.admin.count({
        where: { role: 'SUPER_ADMIN' }
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          message: "لا يمكن حذف آخر مدير عام. أضف مدير عام آخر أولاً."
        });
      }
    }

    await prisma.admin.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "تم حذف المدير بنجاح"
    });

  } catch (error) {
    console.error('Delete system employee error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في حذف المدير"
    });
  }
};

// Get All Withdrawals
export const getAllWithdrawals = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (search) {
      where.company = {
        name: { contains: search, mode: 'insensitive' }
      };
    }

    const [withdrawals, totalCount] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.withdrawal.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      success: true,
      message: "تم جلب طلبات السحب بنجاح",
      data: {
        data: withdrawals,
        pagination: {
          page,
          totalPages,
          total: totalCount,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب طلبات السحب"
    });
  }
};

// Approve Withdrawal
export const approveWithdrawal = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "طلب السحب غير موجود"
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن تغيير حالة طلب السحب"
      });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: { status: 'APPROVED' }
    });

    res.json({
      success: true,
      message: "تمت الموافقة على طلب السحب",
      data: updatedWithdrawal
    });

  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في الموافقة على طلب السحب"
    });
  }
};


// Get properties expiring in 24 hours
export const getExpiringProperties = async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const properties = await prisma.property.findMany({
      where: {
        status: 'active',
        expiresAt: {
          gt: now,
          lte: tomorrow
        }
      },
      include: {
        company: {
          select: { name: true, phone: true }
        }
      },
      orderBy: { expiresAt: 'asc' }
    });

    res.json({
      success: true,
      data: properties
    });

  } catch (error) {
    console.error('Get expiring properties error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في جلب العقارات المنتهية"
    });
  }
};

// Reject Withdrawal
export const rejectWithdrawal = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id }
    });

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: "طلب السحب غير موجود"
      });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({
        success: false,
        message: "لا يمكن تغيير حالة طلب السحب"
      });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: { status: 'REJECTED' }
    });

    res.json({
      success: true,
      message: "تم رفض طلب السحب",
      data: updatedWithdrawal
    });

  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: "خطأ في رفض طلب السحب"
    });
  }
};

// Toggle Property Featured Status (Normal & Plus)
export const updatePropertyFeaturedStatus = async (req: Request, res: Response) => {
  try {
    const propertyId = parseInt(req.params.id);
    const { isFeatured, isFeaturedPlus } = req.body;

    const data: any = {};
    if (isFeatured !== undefined) data.isFeatured = isFeatured;
    if (isFeaturedPlus !== undefined) data.isFeaturedPlus = isFeaturedPlus;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data,
    });

    res.json({
      success: true,
      message: 'تم تحديث حالة التميز للعقار',
      data: property
    });
  } catch (error) {
    console.error('Update property featured status error:', error);
    res.status(500).json({
      success: false,
      message: 'فشل تحديث حالة التميز'
    });
  }
};

export const getSubscriptionRequests = async (req: Request, res: Response) => {
  try {
    const result = await getSubscriptionRequestsService();
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateSubscriptionRequestStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const result = await updateSubscriptionRequestStatusService(Number(id), status, adminNotes);
    res.status(200).json(result);
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// ========== Settings ==========
export const getSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await prisma.setting.findMany();
    const settingsMap: Record<string, string> = {};
    settings.forEach(s => {
      settingsMap[s.key] = s.value;
    });
    res.status(200).json({ success: true, data: settingsMap });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to get settings" });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: "Settings data is required" });
    }

    // Flatten nested objects into key-value pairs
    const flatEntries: { key: string; value: string }[] = [];
    for (const [section, values] of Object.entries(data)) {
      if (typeof values === 'object' && values !== null) {
        for (const [field, val] of Object.entries(values as Record<string, any>)) {
          flatEntries.push({ key: `${section}.${field}`, value: String(val) });
        }
      } else {
        flatEntries.push({ key: section, value: String(values) });
      }
    }

    for (const entry of flatEntries) {
      await prisma.setting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: { key: entry.key, value: entry.value },
      });
    }

    res.status(200).json({ success: true, message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update settings" });
  }
};
