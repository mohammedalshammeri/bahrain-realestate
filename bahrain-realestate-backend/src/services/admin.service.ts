// Admin Service - Admin operations
import { db } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { CompanyStatus, ComplaintStatus, SubscriptionRequestStatus } from "@prisma/client";
import { createNotificationService } from "./company.service";

export const getDashboardService = async () => {
  try {
    const [totalCompanies, pendingCompanies, approvedCompanies, totalProperties, totalComplaints] =
      await Promise.all([
        db.company.count(),
        db.company.count({ where: { status: "pending" } }),
        db.company.count({ where: { status: "approved" } }),
        db.property.count(),
        db.complaint.count(),
      ]);

    return {
      success: true,
      data: {
        totalCompanies,
        pendingCompanies,
        approvedCompanies,
        totalProperties,
        totalComplaints,
      },
    };
  } catch (error) {
    throw new AppError("Failed to get dashboard data", 500);
  }
};

export const getAllCompaniesService = async (
  skip: number = 0,
  take: number = 10,
  status?: CompanyStatus
) => {
  try {
    const where = status ? { status } : {};

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          crNumber: true,
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
          _count: {
            select: {
              properties: true,
              complaints: true,
            },
          },
        },
        skip,
        take,
        orderBy: { createdAt: "desc" },
      }),
      db.company.count({ where }),
    ]);

    return {
      success: true,
      data: companies,
      pagination: {
        total,
        skip,
        take,
        pages: Math.ceil(total / take),
      },
    };
  } catch (error) {
    throw new AppError("Failed to get companies", 500);
  }
};

export const updateCompanyStatusService = async (
  companyId: number,
  status: CompanyStatus
) => {
  try {
    // Verify company exists
    const company = await db.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw new AppError("Company not found", 404);
    }

    // Update status
    const updatedCompany = await db.company.update({
      where: { id: companyId },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        updatedAt: true,
      },
    });

    return {
      success: true,
      data: updatedCompany,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update company status", 500);
  }
};

export const getAllComplaintsService = async (
  skip: number = 0,
  take: number = 10,
  status?: ComplaintStatus
) => {
  try {
    const where = status ? { status } : {};

    const [complaints, total] = await Promise.all([
      db.complaint.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              email: true,
            },
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
            },
          },
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
    throw new AppError("Failed to get complaints", 500);
  }
};

export const getComplaintByIdService = async (complaintId: number) => {
  try {
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            crNumber: true,
          },
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
          },
        },
      },
    });

    if (!complaint) {
      throw new AppError("Complaint not found", 404);
    }

    return {
      success: true,
      data: complaint,
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to get complaint details", 500);
  }
};

export const updateComplaintStatusService = async (
  complaintId: number,
  status: ComplaintStatus,
  adminNotes?: string
) => {
  try {
    // Validate status
    const validStatuses: ComplaintStatus[] = ["new", "under_review", "resolved"];
    if (!validStatuses.includes(status)) {
      throw new AppError("Invalid complaint status", 400);
    }

    // Verify complaint exists
    const complaint = await db.complaint.findUnique({
      where: { id: complaintId },
    });

    if (!complaint) {
      throw new AppError("Complaint not found", 404);
    }

    // Prepare update data
    const updateData: any = {
      status,
      resolvedAt: status === "resolved" ? new Date() : (status === "new" ? null : complaint.resolvedAt),
    };

    // Only update adminNotes if provided
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes.trim() || null;
    }

    // Update complaint
    const updatedComplaint = await db.complaint.update({
      where: { id: complaintId },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return {
      success: true,
      data: updatedComplaint,
      message: "Complaint updated successfully",
    };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update complaint", 500);
  }
};

// Keep backward compatibility
export const updateComplaintService = updateComplaintStatusService;

export const getCompanyDetailsService = async (companyId: number) => {
  try {
    const company = await db.company.findUnique({
      where: { id: companyId },
      include: {
        properties: {
          select: {
            id: true,
            type: true,
            purpose: true,
            price: true,
            status: true,
            createdAt: true,
          },
        },
        complaints: {
          select: {
            id: true,
            message: true,
            status: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentStatus: true,
            createdAt: true,
          },
        },
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
    throw new AppError("Failed to get company details", 500);
  }
};

export const getSubscriptionRequestsService = async () => {
  try {
    const requests = await db.subscriptionRequest.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            subscriptionPlan: true,
          },
        },
        package: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Remap company subscriptionPlan if needed, checking schema I saw earlier:
    // subscriptionPlan     String  @default("free") @map("subscription_plan")
    
    return { success: true, data: requests };
  } catch (error) {
    throw new AppError("Failed to get subscription requests", 500);
  }
};

export const updateSubscriptionRequestStatusService = async (
  requestId: number,
  status: SubscriptionRequestStatus,
  adminNotes?: string
) => {
  try {
    const request = await db.subscriptionRequest.findUnique({
      where: { id: requestId },
      include: {
        package: true,
        company: true,
      },
    });

    if (!request) {
      throw new AppError("Request not found", 404);
    }

    if (request.status !== "PENDING") {
      throw new AppError("Request is already processed", 400);
    }

    const result = await db.$transaction(async (tx) => {
      // Update request status
      const updatedRequest = await tx.subscriptionRequest.update({
        where: { id: requestId },
        data: {
          status,
          adminNotes,
        },
      });

      // If approved, update company package
      if (status === "APPROVED") {
        const pkg = request.package;
        const now = new Date();
        const endDate = new Date();
        endDate.setDate(now.getDate() + pkg.durationDays);

        await tx.company.update({
          where: { id: request.companyId },
          data: {
            subscriptionPlan: pkg.nameEn, // or use package ID if schema supported it. Schema uses String.
            subscriptionStartDate: now,
            subscriptionEndDate: endDate,
            subscriptionStatus: "active",
            employeesLimit: { increment: 0 }, // If package had employee limit? Schema has local limit.
            // Update limits based on package
            freeAdsRemaining: pkg.adsLimit, 
            featuredAdsBalance: pkg.featuredAdsLimit,
          },
        });
      }

      return updatedRequest;
    });

    // Create notification for company about subscription request status
    try {
      if (status === "APPROVED") {
        const pkg = request.package;
        await createNotificationService(
          request.companyId,
          "subscription_approved",
          "تم تفعيل باقة الاشتراك",
          `تم تفعيل باقة الاشتراك ${pkg.nameAr || pkg.nameEn} بنجاح`,
          {
            subscriptionRequestId: result.id,
            packageId: pkg.id,
            adsLimit: pkg.adsLimit,
            featuredAdsLimit: pkg.featuredAdsLimit,
          }
        );
      } else if (status === "REJECTED") {
        await createNotificationService(
          request.companyId,
          "subscription_rejected",
          "تم رفض طلب الباقة",
          adminNotes || "تم رفض طلب الباقة من قبل الإدارة",
          {
            subscriptionRequestId: result.id,
          }
        );
      }
    } catch (notifyError) {
      // لا نُسقط العملية لو فشل إنشاء الإشعار، فقط نطبع في السجل
      console.error("Failed to create subscription notification", notifyError);
    }

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("Failed to update request status", 500);
  }
};
