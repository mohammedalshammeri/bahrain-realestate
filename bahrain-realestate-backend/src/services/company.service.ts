// Company Service - Company operations
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { PropertyPurpose, PropertyStatus, Prisma, EmployeeStatus } from "@prisma/client";
import { createAfsPaymentSession } from "../integrations/afs";

export const respondToIndividualPropertyOfferService = async (
  companyId: number,
  offerId: number,
  data: { status: 'ACCEPTED' | 'REJECTED'; companyPrice?: number }
) => {
  try {
    const offer = await db.individualPropertyCompanyOffer.findUnique({
      where: { id: offerId },
      include: {
        property: { select: { id: true, minimumPrice: true, status: true } },
      },
    });

    if (!offer) {
      throw new AppError("Offer not found", 404);
    }

    if (offer.companyId !== companyId) {
      throw new AppError("Unauthorized", 403);
    }

    const propertyStatus = String(offer.property.status || '').toUpperCase();
    if (!['SENT_TO_COMPANIES', 'ACTIVE'].includes(propertyStatus)) {
      throw new AppError(
        "Property is not eligible for company response (must be distributed by admin first)",
        400
      );
    }

    if (data.status === 'ACCEPTED') {
      if (data.companyPrice === undefined || Number.isNaN(Number(data.companyPrice))) {
        throw new AppError("companyPrice is required", 400);
      }

      const min = Number(offer.property.minimumPrice);
      const price = Number(data.companyPrice);

      if (!Number.isFinite(price) || price < 0) {
        throw new AppError("companyPrice must be a non-negative number", 400);
      }

      if (price < min) {
        throw new AppError(`companyPrice must be >= minimumPrice (${min})`, 400);
      }

      const [updatedOffer] = await db.$transaction([
        db.individualPropertyCompanyOffer.update({
          where: { id: offerId },
          data: {
            status: 'ACCEPTED',
            companyPrice: new Prisma.Decimal(price),
          },
        }),
        db.individualProperty.update({
          where: { id: offer.propertyId },
          data: { status: 'ACTIVE' },
        }),
      ]);

      return { success: true, data: updatedOffer };
    }

    const updatedOffer = await db.$transaction(async (tx) => {
      const updated = await tx.individualPropertyCompanyOffer.update({
        where: { id: offerId },
        data: {
          status: 'REJECTED',
          companyPrice: null,
        },
      });

      const acceptedCount = await tx.individualPropertyCompanyOffer.count({
        where: {
          propertyId: offer.propertyId,
          status: 'ACCEPTED',
          companyPrice: { not: null },
        },
      });

      if (acceptedCount === 0) {
        await tx.individualProperty.update({
          where: { id: offer.propertyId },
          data: { status: 'SENT_TO_COMPANIES' },
        });
      }

      return updated;
    });

    return { success: true, data: updatedOffer };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update offer", 500);
  }
};

export const getCompanyIndividualPropertyOffersService = async (
  companyId: number,
  options?: { status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' }
) => {
  try {
    const offers = await db.individualPropertyCompanyOffer.findMany({
      where: {
        companyId,
        ...(options?.status ? { status: options.status } : {}),
      },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
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
            createdAt: true,
            updatedAt: true,
            images: {
              select: {
                imageUrl: true,
                displayOrder: true,
                isCover: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: offers };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get offers", 500);
  }
};

export const getCompanyIndividualPropertyOfferByIdService = async (
  companyId: number,
  offerId: number
) => {
  try {
    const offer = await db.individualPropertyCompanyOffer.findUnique({
      where: { id: offerId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            description: true,
            videoUrl: true,
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
            createdAt: true,
            updatedAt: true,
            images: {
              select: {
                imageUrl: true,
                displayOrder: true,
                isCover: true,
              },
            },
          },
        },
      },
    });

    if (!offer) {
      throw new AppError("Offer not found", 404);
    }

    if (offer.companyId !== companyId) {
      throw new AppError("Unauthorized", 403);
    }

    return { success: true, data: offer };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get offer", 500);
  }
};

export const getCompanyProfileService = async (companyId: number) => {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        crNumber: true,
        licenseImageUrl: true,
        status: true,
        employeesLimit: true,
        freeAdsRemaining: true,
        featuredAdsBalance: true,
        subscriptionPlan: true,
        subscriptionStartDate: true,
        subscriptionEndDate: true,
        subscriptionStatus: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    return {
      success: true,
      data: company,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get company profile", 500);
  }
};

export const updateCompanyProfileService = async (
  companyId: number,
  data: { name?: string; phone?: string; licenseImageUrl?: string }
) => {
  try {
    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // Update company
    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.licenseImageUrl && { licenseImageUrl: data.licenseImageUrl }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        crNumber: true,
        licenseImageUrl: true,
        status: true,
        employeesLimit: true,
        freeAdsRemaining: true,
        featuredAdsBalance: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: updatedCompany,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update company profile", 500);
  }
};

export const getCompanyPropertiesService = async (
  companyId: number,
  skip: number = 0,
  take: number = 10
) => {
  try {
    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // Get properties
    const [properties, total] = await Promise.all([
      db.property.findMany({
        where: { companyId },
        include: {
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
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.property.count({ where: { companyId } }),
    ]);

    return {
      success: true,
      data: properties,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get company properties", 500);
  }
};

export const getCompanyPropertyByIdService = async (companyId: number, propertyId: number) => {
  try {
    if (!companyId) throw new AppError("Unauthorized", 401);

    const property = await db.property.findFirst({
      where: { id: propertyId, companyId },
      include: {
        propertyImages: { orderBy: { displayOrder: 'asc' } },
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    return { success: true, data: property };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get company property", 500);
  }
};

export const createPropertyService = async (
  companyId: number,
  employeeId: number,
  data: {
    title?: string;
    type: string;
    purpose: PropertyPurpose;
    price: number;
    governorate: string;
    area: string;
    branch?: string;
    description: string;
    locationLat?: number;
    locationLng?: number;
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
    condition?: string;
    showPhone?: boolean;
    enableWhatsapp?: boolean;
    videoUrl?: string | null;
  }
) => {
  try {
    // Verify company exists & has remaining ads
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        freeAdsRemaining: true,
        subscriptionPlan: true,
      },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    if (company.freeAdsRemaining <= 0) {
      throw new AppError(
        "You have reached your ad limit for this subscription plan. Please upgrade your plan.",
        400
      );
    }

    // Calculate expiry date (30 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create property and decrement free ads in a single transaction
    const [property] = await db.$transaction([
      db.property.create({
        data: {
          companyId,
          createdByEmployeeId: employeeId,
          ...(data.title !== undefined && { title: data.title || null }),
          type: data.type,
          purpose: data.purpose,
          price: data.price.toString(),
          governorate: data.governorate,
          area: data.area,
          branch: data.branch,
          description: data.description,
          locationLat: data.locationLat ? data.locationLat.toString() : null,
          locationLng: data.locationLng ? data.locationLng.toString() : null,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          areaSqm: data.areaSqm,
          furnishingStatus: data.furnishingStatus,
          floorsCount: data.floorsCount,
          floorNumber: data.floorNumber,
          livingRooms: data.livingRooms,
          buildingAge: data.buildingAge,
          ...(data.negotiable !== undefined && { negotiable: data.negotiable }),
          ...(data.parkingCount !== undefined && { parkingCount: data.parkingCount }),
          ...(data.condition !== undefined && { condition: data.condition || null }),
          ...(data.showPhone !== undefined && { showPhone: data.showPhone }),
          ...(data.enableWhatsapp !== undefined && { enableWhatsapp: data.enableWhatsapp }),
          ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
          status: PropertyStatus.pending, // Require admin approval by default
          expiresAt,
        },
        include: {
          propertyImages: true,
        },
      }),
      db.company.update({
        where: { id: companyId },
        data: {
          freeAdsRemaining: {
            decrement: 1,
          },
        },
      }),
    ]);

    return {
      success: true,
      data: property,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create property", 500);
  }
};

export const updatePropertyService = async (
  companyId: number,
  propertyId: number,
  employeeId: number,
  employeeRole: string,
  data: Partial<{
    title: string;
    type: string;
    purpose: PropertyPurpose;
    price: number;
    governorate: string;
    area: string;
    branch: string;
    description: string;
    locationLat: number;
    locationLng: number;
    bedrooms: number;
    bathrooms: number;
    areaSqm: number;
    isFeatured: boolean;
    negotiable: boolean;
    parkingCount: number;
    condition: string;
    showPhone: boolean;
    enableWhatsapp: boolean;
    videoUrl: string | null;
    status: PropertyStatus;
  }>
) => {  try {
    // Verify property belongs to company
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        companyId: true,
        createdByEmployeeId: true,
        updatedByEmployeeId: true,
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.companyId !== companyId) {
      throw new AppError("Unauthorized to update this property", 403);
    }

    // Check ownership permissions
    // OWNER and MANAGER can modify any property
    // AGENT can only modify properties they created
    if (employeeRole === "AGENT" && property.createdByEmployeeId !== employeeId) {
      throw new AppError("You can only update properties you created", 403);
    }

    // Update property
    const updatedProperty = await db.property.update({
      where: { id: propertyId },
      data: {
        updatedByEmployeeId: employeeId,
        ...(data.title !== undefined && { title: data.title || null }),
        ...(data.type && { type: data.type }),
        ...(data.purpose && { purpose: data.purpose }),
        ...(data.price && { price: data.price.toString() }),
        ...(data.governorate && { governorate: data.governorate }),
        ...(data.area && { area: data.area }),
        ...(data.branch !== undefined && { branch: data.branch || null }),
        ...(data.description && { description: data.description }),
        ...(data.locationLat && { locationLat: data.locationLat.toString() }),
        ...(data.locationLng && { locationLng: data.locationLng.toString() }),
        ...(data.bedrooms !== undefined && { bedrooms: data.bedrooms }),
        ...(data.bathrooms !== undefined && { bathrooms: data.bathrooms }),
        ...(data.areaSqm !== undefined && { areaSqm: data.areaSqm }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.negotiable !== undefined && { negotiable: data.negotiable }),
        ...(data.parkingCount !== undefined && { parkingCount: data.parkingCount }),
        ...(data.condition !== undefined && { condition: data.condition || null }),
        ...(data.showPhone !== undefined && { showPhone: data.showPhone }),
        ...(data.enableWhatsapp !== undefined && { enableWhatsapp: data.enableWhatsapp }),
        ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
        ...(data.status !== undefined && { status: data.status }),
      },
      include: {
        propertyImages: true,
      },
    });

    return {
      success: true,
      data: updatedProperty,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update property", 500);
  }
};

export const deletePropertyService = async (
  companyId: number,
  propertyId: number,
  employeeId: number,
  employeeRole: string
) => {  try {
    // Verify property belongs to company
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        companyId: true,
        createdByEmployeeId: true,
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.companyId !== companyId) {
      throw new AppError("Unauthorized to delete this property", 403);
    }

    // Check ownership permissions
    // OWNER and MANAGER can delete any property
    // AGENT can only delete properties they created
    if (employeeRole === "AGENT" && property.createdByEmployeeId !== employeeId) {
      throw new AppError("You can only delete properties you created", 403);
    }

    // Delete property (cascades to images)
    await db.property.delete({
      where: { id: propertyId },
    });

    return {
      success: true,
      message: "Property deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete property", 500);
  }
};

export const registerEmployeeService = async (
  companyId: number,
  name: string,
  email: string,
  phone: string | undefined,
  role: "MANAGER" | "AGENT",
  password: string
) => {
  try {
    // Check if company exists and is approved
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    if (company.status !== "approved") {
      throw new AppError("Company must be approved to add employees", 403);
    }

    // Check if employee email is unique globally
    const existingEmployee = await db.companyEmployee.findFirst({
      where: {
        email,
      },
    });

    if (existingEmployee) {
      throw new AppError("Employee with this email already exists in the system", 409);
    }

    // Hash password
    const { hashPassword } = await import("../utils/bcrypt");
    const passwordHash = await hashPassword(password);

    // Create employee
    const employee = await db.companyEmployee.create({
      data: {
        companyId,
        name,
        email,
        phone: phone || null,
        role,
        passwordHash,
        isActive: true,
        status: EmployeeStatus.active,
      },
    });

    return {
      success: true,
      data: {
        id: employee.id,
        companyId: employee.companyId,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        isActive: employee.isActive,
        createdAt: employee.createdAt,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to register employee", 500);
  }
};

export const getCompanyEmployeesService = async (companyId: number) => {
  try {
    // تحقق من وجود الشركة
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // جلب جميع الموظفين
    const employees = await db.companyEmployee.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { id: "asc" },
    });

    return {
      success: true,
      data: employees,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get company employees", 500);
  }
};

export const deleteEmployeeService = async (
  companyId: number,
  employeeId: number,
  requestingEmployeeRole: string
) => {
  try {
    // Only OWNER can delete employees
    if (requestingEmployeeRole !== "OWNER") {
      throw new AppError("Only company owner can delete employees", 403);
    }

    const owner = await db.companyEmployee.findFirst({
      where: {
        companyId,
        role: "OWNER",
      },
      select: { id: true },
    });

    if (!owner) {
      throw new AppError("Company owner not found", 500);
    }

    // Check if employee exists and belongs to this company
    const employee = await db.companyEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError("This employee does not belong to your company", 403);
    }

    // Cannot delete the owner
    if (employee.role === "OWNER") {
      throw new AppError("Cannot delete company owner", 403);
    }

    await db.$transaction(async (tx) => {
      // Reassign any references that would block deletion (FK constraints)
      await tx.property.updateMany({
        where: { createdByEmployeeId: employeeId },
        data: { createdByEmployeeId: owner.id },
      });

      await tx.property.updateMany({
        where: { updatedByEmployeeId: employeeId },
        data: { updatedByEmployeeId: owner.id },
      });

      await tx.propertyImage.updateMany({
        where: { createdByEmployeeId: employeeId },
        data: { createdByEmployeeId: owner.id },
      });

      // Delete employee
      await tx.companyEmployee.delete({
        where: { id: employeeId },
      });
    });

    return {
      success: true,
      message: "Employee deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;

    // Help debug production issues (e.g., FK constraints) without leaking details to clients
    console.error('[deleteEmployeeService] Failed to delete employee', {
      companyId,
      employeeId,
      error,
    });

    // Prisma FK constraint error typically surfaces as code P2003
    const anyError = error as any;
    if (anyError?.code === 'P2003') {
      throw new AppError('Cannot delete employee due to related records', 409);
    }
    throw new AppError("Failed to delete employee", 500);
  }
};

export const updateEmployeeService = async (
  companyId: number,
  employeeId: number,
  requestingEmployeeRole: string,
  data: {
    name?: string;
    phone?: string;
    role?: "MANAGER" | "AGENT";
    isActive?: boolean;
  }
) => {
  try {
    // Only OWNER can update employees
    if (requestingEmployeeRole !== "OWNER") {
      throw new AppError("Only company owner can update employees", 403);
    }

    // Check if employee exists and belongs to this company
    const employee = await db.companyEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError("This employee does not belong to your company", 403);
    }    // Cannot change owner role
    if (employee.role === "OWNER" && data.role) {
      throw new AppError("Cannot change owner role", 403);
    }

    // Update employee
    const updatedEmployee = await db.companyEmployee.update({
      where: { id: employeeId },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone || null }),
        ...(data.role && { role: data.role }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    return {
      success: true,
      data: {
        id: updatedEmployee.id,
        companyId: updatedEmployee.companyId,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        role: updatedEmployee.role,
        isActive: updatedEmployee.isActive,
        updatedAt: updatedEmployee.updatedAt,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update employee", 500);
  }
};

export const toggleEmployeeStatusService = async (
  companyId: number,
  employeeId: number,
  requestingEmployeeRole: string
) => {
  try {
    // Only OWNER can toggle employee status
    if (requestingEmployeeRole !== "OWNER") {
      throw new AppError("Only company owner can toggle employee status", 403);
    }

    // Check if employee exists and belongs to this company
    const employee = await db.companyEmployee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      throw new AppError("Employee not found", 404);
    }

    if (employee.companyId !== companyId) {
      throw new AppError("This employee does not belong to your company", 403);
    }

    // Cannot deactivate the owner
    if (employee.role === "OWNER") {
      throw new AppError("Cannot deactivate company owner", 403);
    }

    // Toggle employee status
    const updatedEmployee = await db.companyEmployee.update({
      where: { id: employeeId },
      data: {
        isActive: !employee.isActive,
      },
    });

    return {
      success: true,
      data: {
        id: updatedEmployee.id,
        companyId: updatedEmployee.companyId,
        name: updatedEmployee.name,
        email: updatedEmployee.email,
        phone: updatedEmployee.phone,
        role: updatedEmployee.role,
        isActive: updatedEmployee.isActive,
        updatedAt: updatedEmployee.updatedAt,
      },
      message: `Employee ${updatedEmployee.isActive ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to toggle employee status", 500);
  }
};

// Property Image Services
export const createPropertyImageService = async (
  propertyId: number,
  imageUrl: string,
  employeeId: number,
  employeeRole: string,
  companyId: number
) => {
  try {
    // Verify property exists and belongs to company
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.companyId !== companyId) {
      throw new AppError("Unauthorized to add image to this property", 403);
    }

    // Check ownership permissions
    // OWNER and MANAGER can add images to any property
    // AGENT can only add images to properties they created
    if (employeeRole === "AGENT" && property.createdByEmployeeId !== employeeId) {
      throw new AppError("You can only add images to properties you created", 403);
    }

    // Get next display order
    const lastImage = await db.propertyImage.findFirst({
      where: { propertyId },
      orderBy: { displayOrder: "desc" },
    });

    const displayOrder = lastImage ? lastImage.displayOrder + 1 : 1;

    // Detect if the file is a video
    const isVideoFile = /\.(mp4|mov|webm|mkv)(\?.*)?$/i.test(imageUrl);

    // Create property image
    const propertyImage = await db.propertyImage.create({
      data: {
        propertyId,
        createdByEmployeeId: employeeId,
        imageUrl,
        displayOrder,
        isVideo: isVideoFile,
      },
    });

    return {
      success: true,
      data: propertyImage,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to add property image", 500);
  }
};

export const deletePropertyImageService = async (
  imageId: number,
  employeeId: number,
  employeeRole: string,
  companyId: number
) => {
  try {
    // Find property image with property details
    const propertyImage = await db.propertyImage.findUnique({
      where: { id: imageId },
      include: {
        property: true,
      },
    });

    if (!propertyImage) {
      throw new AppError("Property image not found", 404);
    }

    if (propertyImage.property.companyId !== companyId) {
      throw new AppError("Unauthorized to delete this image", 403);
    }

    // Check ownership permissions
    // OWNER and MANAGER can delete any image
    // AGENT can only delete images from properties they created OR images they uploaded
    if (employeeRole === "AGENT") {
      const canDelete = 
        propertyImage.property.createdByEmployeeId === employeeId ||
        propertyImage.createdByEmployeeId === employeeId;
        
      if (!canDelete) {
        throw new AppError("You can only delete images from your own properties or images you uploaded", 403);
      }
    }

    // Delete property image
    await db.propertyImage.delete({
      where: { id: imageId },
    });

    return {
      success: true,
      message: "Property image deleted successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to delete property image", 500);
  }
};

export const featurePropertyService = async (
  companyId: number,
  employeeId: number,
  employeeRole: string,
  propertyId: number
) => {
  try {
    // Only OWNER or MANAGER can feature properties
    if (employeeRole === "AGENT") {
      throw new AppError("Only company owners and managers can feature properties", 403);
    }

    // Verify company exists and has featured ads balance
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        featuredAdsBalance: true,
      },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    if (company.featuredAdsBalance <= 0) {
      throw new AppError("Insufficient featured ads balance. Please purchase more featured ad credits.", 400);
    }

    // Verify property exists and belongs to company
    const property = await db.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        companyId: true,
        isFeatured: true,
        status: true,
      },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    if (property.companyId !== companyId) {
      throw new AppError("Unauthorized to feature this property", 403);
    }

    if (property.status !== "active") {
      throw new AppError("Cannot feature inactive properties", 400);
    }

    if (property.isFeatured) {
      throw new AppError("Property is already featured", 400);
    }

    // Use transaction to ensure atomicity
    const [updatedProperty, updatedCompany] = await db.$transaction([
      // Update property to featured
      db.property.update({
        where: { id: propertyId },
        data: {
          isFeatured: true,
          updatedByEmployeeId: employeeId,
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
          propertyImages: {
            orderBy: { displayOrder: "asc" },
          },
        },
      }),
      // Decrease company's featured ads balance
      db.company.update({
        where: { id: companyId },
        data: {
          featuredAdsBalance: {
            decrement: 1,
          },
        },
        select: {
          id: true,
          featuredAdsBalance: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        property: updatedProperty,
        remainingBalance: updatedCompany.featuredAdsBalance,
      },
      message: "Property featured successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to feature property", 500);
  }
};

export const getFeaturedAdsBalanceService = async (companyId: number) => {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        featuredAdsBalance: true,
      },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    return {
      success: true,
      data: {
        companyId: company.id,
        featuredAdsBalance: company.featuredAdsBalance,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get featured ads balance", 500);
  }
};

export const getCompanyComplaintsService = async (
  companyId: number,
  skip: number = 0,
  take: number = 10,
  status?: string
) => {
  try {
    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // Build where clause
    const where: any = { companyId };
    if (status && ["new", "under_review", "resolved"].includes(status)) {
      where.status = status;
    }

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        select: {
          id: true,
          userPhone: true,
          userEmail: true,
          message: true,
          status: true,
          adminNotes: true,
          createdAt: true,
          resolvedAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.complaint.count({ where }),
    ]);

    return {
      success: true,
      data: complaints,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get company complaints", 500);
  }
};

// PaymentTransaction services
export const createPaymentTransactionService = async (
  companyId: number,
  packageType: string,
  amount: number
) => {
  try {
    const paymentTransaction = await db.paymentTransaction.create({
      data: {
        companyId,        packageType,
        amount,
        status: "pending",
        sessionId: null,
        paymentRef: null,
        callbackData: Prisma.JsonNull,
      },
    });

    return {
      success: true,
      data: paymentTransaction,
    };
  } catch (error) {
    throw new AppError("Failed to create payment transaction", 500);
  }
};

export const updatePaymentSessionService = async (
  transactionId: number,
  amount: number
) => {
  try {
    // Call real AFS payment session API
    const { sessionId, redirectUrl } = await createAfsPaymentSession(amount, transactionId);

    // Update PaymentTransaction with sessionId and redirectUrl
    const paymentTransaction = await db.paymentTransaction.update({
      where: { id: transactionId },
      data: {
        sessionId,
        callbackData: JSON.stringify({ redirectUrl }),
      },
    });

    return {
      success: true,
      data: paymentTransaction,
      redirectUrl,
    };
  } catch (error) {
    throw new AppError("Failed to update payment session", 500);
  }
};

export const processAfsCallbackService = async (
  paymentStatus: string,
  fullCallbackData: any
) => {
  try {
    const { sessionId, paymentId } = fullCallbackData;

    // Find transaction by sessionId
    const transaction = await db.paymentTransaction.findFirst({
      where: { sessionId },
      include: { company: true },
    });

    if (!transaction) {
      throw new AppError("Payment transaction not found", 404);
    }

    // Update transaction
    const updatedTransaction = await db.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: paymentStatus,
        paymentRef: paymentId,
        callbackData: JSON.stringify(fullCallbackData),
      },
    });

    let updatedCompany = transaction.company;

    // If successful payment, update company's featured ads balance
    if (paymentStatus === "success") {
      let balanceIncrease = 0;
      
      // Determine balance increase based on package type
      switch (transaction.packageType.toLowerCase()) {
        case "basic":
          balanceIncrease = 10;
          break;
        case "standard":
          balanceIncrease = 25;
          break;
        case "premium":
          balanceIncrease = 50;
          break;
        case "enterprise":
          balanceIncrease = 100;
          break;
        default:
          balanceIncrease = Math.floor(transaction.amount / 10); // Fallback: amount / 10
      }

      // Update company balance
      updatedCompany = await db.company.update({
        where: { id: transaction.companyId },
        data: {
          featuredAdsBalance: {
            increment: balanceIncrease,
          },
        },
      });
    }

    return {
      success: true,
      data: {
        transaction: updatedTransaction,
        company: updatedCompany,
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to process AFS callback", 500);
  }
};

// Phase 3: Notifications Service Functions
export const getCompanyNotificationsService = async (companyId: number, skip: number = 0, take: number = 20) => {
  try {
    const notificationsResult = await db.$queryRaw`
      SELECT * FROM notifications
      WHERE company_id = ${companyId}
      ORDER BY created_at DESC
      LIMIT ${take} OFFSET ${skip}
    ` as any[];

    const totalResult = await db.$queryRaw`
      SELECT COUNT(*) as count FROM notifications WHERE company_id = ${companyId}
    ` as any[];

    const total = parseInt(totalResult[0].count);

    return {
      success: true,
      data: {
        notifications: notificationsResult,
        pagination: {
          total,
          skip,
          take,
          hasMore: skip + take < total,
        },
      },
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get notifications", 500);
  }
};

export const markNotificationAsReadService = async (companyId: number, notificationId: number) => {
  try {
    const notificationResult = await db.$queryRaw`
      SELECT * FROM notifications WHERE id = ${notificationId} AND company_id = ${companyId} LIMIT 1
    ` as any[];

    if (!notificationResult.length) {
      throw new AppError("Notification not found", 404);
    }

    await db.$queryRaw`
      UPDATE notifications SET is_read = true WHERE id = ${notificationId}
    `;

    const updatedNotification = { ...notificationResult[0], is_read: true };

    return {
      success: true,
      data: updatedNotification,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to mark notification as read", 500);
  }
};

export const markAllNotificationsAsReadService = async (companyId: number) => {
  try {
    await db.$queryRaw`
      UPDATE notifications SET is_read = true WHERE company_id = ${companyId} AND is_read = false
    `;

    return {
      success: true,
      message: "All notifications marked as read",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to mark all notifications as read", 500);
  }
};

export const createNotificationService = async (
  companyId: number,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    const insertResult = await db.$queryRaw`
      INSERT INTO notifications (company_id, type, title, message, data, created_at)
      VALUES (${companyId}, ${type}, ${title}, ${message}, ${data ? JSON.stringify(data) : null}, NOW())
      RETURNING *
    ` as any[];

    const notification = insertResult[0];

    return {
      success: true,
      data: notification,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create notification", 500);
  }
};

// Phase 3: Featured Packages Service Functions
export const createFeaturedPackageService = async (
  propertyId: number,
  companyId: number,
  duration: number
) => {
  try {
    // Check if property exists and belongs to company
    const property = await db.property.findFirst({
      where: { id: propertyId, companyId },
    });

    if (!property) {
      throw new AppError("Property not found or does not belong to company", 404);
    }

    // Check if property is already featured and active
    const existingPackageResult = await db.$queryRaw`
      SELECT * FROM featured_packages
      WHERE property_id = ${propertyId} AND status = 'active' AND end_date > NOW()
      LIMIT 1
    ` as any[];

    if (existingPackageResult.length > 0) {
      throw new AppError("Property is already featured", 400);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + duration);

    const insertResult = await db.$queryRaw`
      INSERT INTO featured_packages (property_id, company_id, duration, start_date, end_date, status, created_at, updated_at)
      VALUES (${propertyId}, ${companyId}, ${duration}, ${startDate}, ${endDate}, 'active', NOW(), NOW())
      RETURNING *
    ` as any[];

    const featuredPackage = insertResult[0];

    // Update property as featured
    await db.property.update({
      where: { id: propertyId },
      data: { isFeatured: true },
    });

    // Create notification
    await createNotificationService(
      companyId,
      'featured_activated',
      'Property Featured',
      `Your property has been featured for ${duration} days`,
      { propertyId, packageId: featuredPackage.id, duration }
    );

    return {
      success: true,
      data: featuredPackage,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to create featured package", 500);
  }
};

export const getCompanyFeaturedPackagesService = async (companyId: number) => {
  try {
    const packagesResult = await db.$queryRaw`
      SELECT
        fp.*,
        p.id as property_id, p.title, p.type, p.governorate, p.area
      FROM featured_packages fp
      INNER JOIN properties p ON fp.property_id = p.id
      WHERE fp.company_id = ${companyId}
      ORDER BY fp.created_at DESC
    ` as any[];

    // Transform the results to match the expected format
    const packages = packagesResult.map(row => ({
      ...row,
      property: {
        id: row.property_id,
        title: row.title,
        type: row.type,
        governorate: row.governorate,
        area: row.area,
      },
    }));

    return {
      success: true,
      data: packages,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get featured packages", 500);
  }
};

export const cancelFeaturedPackageService = async (companyId: number, packageId: number) => {
  try {
    const packageDataResult = await db.$queryRaw`
      SELECT * FROM featured_packages WHERE id = ${packageId} AND company_id = ${companyId} LIMIT 1
    ` as any[];

    if (!packageDataResult.length) {
      throw new AppError("Featured package not found", 404);
    }

    const packageData = packageDataResult[0];

    if (packageData.status !== 'active') {
      throw new AppError("Package is not active", 400);
    }

    // Update package status
    await db.$queryRaw`
      UPDATE featured_packages SET status = 'cancelled', updated_at = NOW() WHERE id = ${packageId}
    `;

    const updatedPackage = { ...packageData, status: 'cancelled' };

    // Update property as not featured
    await db.property.update({
      where: { id: packageData.property_id },
      data: { isFeatured: false },
    });

    // Create notification
    await createNotificationService(
      companyId,
      'featured_expired',
      'Featured Package Cancelled',
      'Your featured package has been cancelled',
      { propertyId: packageData.property_id, packageId }
    );

    return {
      success: true,
      data: updatedPackage,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to cancel featured package", 500);
  }
};

export const extendFeaturedPackageService = async (
  companyId: number,
  packageId: number,
  additionalDays: number
) => {
  try {
    const packageDataResult = await db.$queryRaw`
      SELECT * FROM featured_packages WHERE id = ${packageId} AND company_id = ${companyId} LIMIT 1
    ` as any[];

    if (!packageDataResult.length) {
      throw new AppError("Featured package not found", 404);
    }

    const packageData = packageDataResult[0];

    if (packageData.status !== 'active') {
      throw new AppError("Package is not active", 400);
    }

    const newEndDate = new Date(packageData.end_date);
    newEndDate.setDate(newEndDate.getDate() + additionalDays);

    await db.$queryRaw`
      UPDATE featured_packages
      SET end_date = ${newEndDate}, duration = ${packageData.duration + additionalDays}, updated_at = NOW()
      WHERE id = ${packageId}
    `;

    const updatedPackage = {
      ...packageData,
      end_date: newEndDate,
      duration: packageData.duration + additionalDays
    };

    return {
      success: true,
      data: updatedPackage,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to extend featured package", 500);
  }
};

// Phase 3: Update property service to handle location coordinates
export const updatePropertyWithLocationService = async (
  companyId: number,
  propertyId: number,
  employeeId: number,
  employeeRole: string,
  updateData: any
) => {
  try {
    // Check permissions
    if (employeeRole !== 'admin' && employeeRole !== 'manager') {
      throw new AppError("Insufficient permissions", 403);
    }

    // Verify property ownership
    const property = await db.property.findFirst({
      where: { id: propertyId, companyId },
    });

    if (!property) {
      throw new AppError("Property not found", 404);
    }

    // Update property
    const updatedProperty = await db.property.update({
      where: { id: propertyId },
      data: {
        ...updateData,
        locationLat: updateData.locationLat ? parseFloat(updateData.locationLat) : undefined,
        locationLng: updateData.locationLng ? parseFloat(updateData.locationLng) : undefined,
        updatedAt: new Date(),
      },
    });

    return {
      success: true,
      data: updatedProperty,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update property", 500);
  }
};

export const createSubscriptionRequestService = async (
  companyId: number,
  packageId: number
) => {
  try {
    const subPackage = await db.subscriptionPackage.findUnique({
      where: { id: packageId },
    });

    if (!subPackage) {
      throw new AppError("Subscription package not found", 404);
    }

    // لا يمكن إنشاء طلب جديد لنفس الباقة إذا كان هناك طلب قيد المراجعة لها
    const existingRequest = await db.subscriptionRequest.findFirst({
      where: {
        companyId,
        subscriptionPackageId: packageId,
        status: "PENDING",
      },
    });

    if (existingRequest) {
      throw new AppError("You already have a pending subscription request", 400);
    }

    // لا يمكن طلب نفس الباقة إذا كان هناك اشتراك مقبول سابق لها ما زال ضمن المدة
    const lastApprovedForPackage = await db.subscriptionRequest.findFirst({
      where: {
        companyId,
        subscriptionPackageId: packageId,
        status: "APPROVED",
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        package: true,
      },
    });

    if (lastApprovedForPackage) {
      const now = new Date();
      const start = new Date(lastApprovedForPackage.createdAt);
      const end = new Date(start.getTime() + lastApprovedForPackage.package.durationDays * 24 * 60 * 60 * 1000);

      if (end.getTime() > now.getTime()) {
        throw new AppError("You already have an active subscription for this package", 400);
      }
    }

    const request = await db.subscriptionRequest.create({
      data: {
        companyId,
        subscriptionPackageId: packageId,
        status: "PENDING",
      },
    });

    return { success: true, data: request };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Subscription request error:", error);
    throw new AppError("Failed to create subscription request", 500);
  }
};

export const getCompanySubscriptionHistoryService = async (companyId: number) => {
  try {
    const requests = await db.subscriptionRequest.findMany({
      where: {
        companyId,
      },
      include: {
        package: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const history = requests.map((req) => ({
      id: req.id,
      packageId: req.subscriptionPackageId,
      packageNameEn: req.package.nameEn,
      packageNameAr: req.package.nameAr,
      durationDays: req.package.durationDays,
      createdAt: req.createdAt,
      // وقت آخر تحديث للحالة (موافقة / رفض من الأدمن)
      processedAt: req.updatedAt,
      status: req.status,
    }));

    return { success: true, data: history };
  } catch (error) {
    if (error instanceof AppError) throw error;
    console.error("Subscription history error:", error);
    throw new AppError("Failed to fetch subscription history", 500);
  }
};
