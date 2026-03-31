import { db } from '../config/database';
import { AppError } from '../middleware/errorHandler';

export interface CreateBoostRequest {
  propertyId: number;
  companyId: number;
  durationHours: number; // in hours
  paymentId?: number;
}

export interface BoostWithProperty {
  id: number;
  propertyId: number;
  companyId: number;
  durationHours: number;
  startDate: Date;
  endDate: Date;
  status: string;
  paymentId?: number;
  createdAt: Date;
  property: {
    id: number;
    title: string;
    type: string;
    status: string;
  };
  company: {
    id: number;
    name: string;
  };
}

/**
 * Create a new boost for a property
 */
export const createBoost = async (boostData: CreateBoostRequest): Promise<BoostWithProperty> => {
  try {
    // Verify property exists and belongs to company
    const propertyResult = await db.$queryRaw`
      SELECT * FROM properties
      WHERE id = ${boostData.propertyId} AND company_id = ${boostData.companyId}
      LIMIT 1
    ` as any[];

    if (!propertyResult.length) {
      throw new AppError('Property not found or does not belong to this company', 404);
    }

    // Check if property already has an active boost
    const activeBoostResult = await db.$queryRaw`
      SELECT * FROM boosts
      WHERE property_id = ${boostData.propertyId} AND status = 'active' AND end_date > NOW()
      LIMIT 1
    ` as any[];

    if (activeBoostResult.length > 0) {
      throw new AppError('Property already has an active boost', 400);
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setHours(endDate.getHours() + boostData.durationHours);

    // Insert new boost
    const insertResult = await db.$queryRaw`
      INSERT INTO boosts (property_id, company_id, duration_hours, start_date, end_date, status, payment_id, created_at, updated_at)
      VALUES (${boostData.propertyId}, ${boostData.companyId}, ${boostData.durationHours}, ${startDate}, ${endDate}, 'active', ${boostData.paymentId}, NOW(), NOW())
      RETURNING *
    ` as any[];

    const newBoost = insertResult[0];

    // Get the boost with property and company details
    const boostWithDetails = await getBoostWithDetails(newBoost.id);

    return boostWithDetails!;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to create boost', 500);
  }
};

/**
 * Get boost with property and company details
 */
export const getBoostWithDetails = async (boostId: number): Promise<BoostWithProperty | null> => {
  try {
    const result = await db.$queryRaw`
      SELECT
        b.id, b.property_id as "propertyId", b.company_id as "companyId",
        b.duration_hours as "durationHours", b.start_date as "startDate",
        b.end_date as "endDate", b.status, b.payment_id as "paymentId", b.created_at as "createdAt",
        p.id as "property_id", p.title, p.type, p.status as "property_status",
        c.id as "company_id", c.name
      FROM boosts b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN companies c ON b.company_id = c.id
      WHERE b.id = ${boostId}
      LIMIT 1
    ` as any[];

    if (!result.length) {
      return null;
    }

    const row = result[0];
    return {
      id: row.id,
      propertyId: row.propertyId,
      companyId: row.companyId,
      durationHours: row.durationHours,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      paymentId: row.paymentId,
      createdAt: row.createdAt,
      property: {
        id: row.property_id,
        title: row.title,
        type: row.type,
        status: row.property_status,
      },
      company: {
        id: row.company_id,
        name: row.name,
      },
    };
  } catch (error) {
    throw new AppError('Failed to get boost details', 500);
  }
};

/**
 * Get active boosts for a company
 */
export const getCompanyActiveBoosts = async (companyId: number): Promise<BoostWithProperty[]> => {
  try {
    const result = await db.$queryRaw`
      SELECT
        b.id, b.property_id as "propertyId", b.company_id as "companyId",
        b.duration_hours as "durationHours", b.start_date as "startDate",
        b.end_date as "endDate", b.status, b.payment_id as "paymentId", b.created_at as "createdAt",
        p.id as "property_id", p.title, p.type, p.status as "property_status",
        c.id as "company_id", c.name
      FROM boosts b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN companies c ON b.company_id = c.id
      WHERE b.company_id = ${companyId} AND b.status = 'active' AND b.end_date > NOW()
      ORDER BY b.created_at DESC
    ` as any[];

    return result.map(row => ({
      id: row.id,
      propertyId: row.propertyId,
      companyId: row.companyId,
      durationHours: row.durationHours,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      paymentId: row.paymentId,
      createdAt: row.createdAt,
      property: {
        id: row.property_id,
        title: row.title,
        type: row.type,
        status: row.property_status,
      },
      company: {
        id: row.company_id,
        name: row.name,
      },
    }));
  } catch (error) {
    throw new AppError('Failed to get company boosts', 500);
  }
};

/**
 * Get all boosts for a company (paginated)
 */
export const getCompanyBoosts = async (
  companyId: number,
  skip: number = 0,
  limit: number = 20
): Promise<BoostWithProperty[]> => {
  try {
    const result = await db.$queryRaw`
      SELECT
        b.id, b.property_id as "propertyId", b.company_id as "companyId",
        b.duration_hours as "durationHours", b.start_date as "startDate",
        b.end_date as "endDate", b.status, b.payment_id as "paymentId", b.created_at as "createdAt",
        p.id as "property_id", p.title, p.type, p.status as "property_status",
        c.id as "company_id", c.name
      FROM boosts b
      INNER JOIN properties p ON b.property_id = p.id
      INNER JOIN companies c ON b.company_id = c.id
      WHERE b.company_id = ${companyId}
      ORDER BY b.created_at DESC
      LIMIT ${limit} OFFSET ${skip}
    ` as any[];

    return result.map(row => ({
      id: row.id,
      propertyId: row.propertyId,
      companyId: row.companyId,
      durationHours: row.durationHours,
      startDate: row.startDate,
      endDate: row.endDate,
      status: row.status,
      paymentId: row.paymentId,
      createdAt: row.createdAt,
      property: {
        id: row.property_id,
        title: row.title,
        type: row.type,
        status: row.property_status,
      },
      company: {
        id: row.company_id,
        name: row.name,
      },
    }));
  } catch (error) {
    throw new AppError('Failed to get company boosts', 500);
  }
};

/**
 * Get expired boosts that need to be deactivated
 */
export const getExpiredBoosts = async (): Promise<any[]> => {
  try {
    const result = await db.$queryRaw`
      SELECT * FROM boosts
      WHERE status = 'active' AND end_date <= NOW()
    ` as any[];

    return result;
  } catch (error) {
    throw new AppError('Failed to get expired boosts', 500);
  }
};

/**
 * Deactivate expired boosts
 */
export const deactivateExpiredBoosts = async (): Promise<number> => {
  try {
    const expiredBoosts = await getExpiredBoosts();

    if (expiredBoosts.length === 0) {
      return 0;
    }

    const boostIds = expiredBoosts.map(boost => boost.id);

    // Update all expired boosts to 'expired' status
    await db.$queryRaw`
      UPDATE boosts
      SET status = 'expired', updated_at = NOW()
      WHERE id = ANY(${boostIds})
    `;

    return expiredBoosts.length;
  } catch (error) {
    throw new AppError('Failed to deactivate expired boosts', 500);
  }
};

/**
 * Cancel a boost (admin or company action)
 */
export const cancelBoost = async (boostId: number, companyId?: number): Promise<void> => {
  try {
    if (companyId) {
      // Cancel boost only if it belongs to the company
      const result = await db.$queryRaw`
        UPDATE boosts
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${boostId} AND company_id = ${companyId} AND status = 'active'
        RETURNING id
      ` as any[];

      if (!result || result.length === 0) {
        throw new AppError('Boost not found or access denied', 404);
      }
    } else {
      // Admin cancel - no company check
      const result = await db.$queryRaw`
        UPDATE boosts
        SET status = 'cancelled', updated_at = NOW()
        WHERE id = ${boostId} AND status = 'active'
        RETURNING id
      ` as any[];

      if (!result || result.length === 0) {
        throw new AppError('Boost not found', 404);
      }
    }
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to cancel boost', 500);
  }
};

/**
 * Extend an existing boost
 */
export const extendBoost = async (
  boostId: number,
  additionalDays: number,
  companyId: number
): Promise<BoostWithProperty> => {
  try {
    // Get current boost
    const currentBoostResult = await db.$queryRaw`
      SELECT * FROM boosts
      WHERE id = ${boostId} AND company_id = ${companyId}
      LIMIT 1
    ` as any[];

    if (!currentBoostResult.length) {
      throw new AppError('Boost not found or access denied', 404);
    }

    const boost = currentBoostResult[0];

    // Calculate new end date (convert additionalDays to hours)
    const currentEndDate = new Date(boost.end_date);
    const newEndDate = new Date(currentEndDate);
    newEndDate.setHours(newEndDate.getHours() + (additionalDays * 24)); // Convert days to hours

    // Update boost
    await db.$queryRaw`
      UPDATE boosts
      SET end_date = ${newEndDate}, duration_hours = ${boost.duration_hours + (additionalDays * 24)}, updated_at = NOW()
      WHERE id = ${boostId}
    `;

    // Return updated boost
    const updatedBoost = await getBoostWithDetails(boostId);
    return updatedBoost!;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Failed to extend boost', 500);
  }
};

/**
 * Get boost statistics for a company
 */
export const getCompanyBoostStats = async (companyId: number) => {
  try {
    const allBoostsResult = await db.$queryRaw`
      SELECT * FROM boosts WHERE company_id = ${companyId}
    ` as any[];

    const activeBoosts = allBoostsResult.filter((boost: any) =>
      boost.status === 'active' && new Date(boost.end_date) > new Date()
    );

    return {
      totalBoosts: allBoostsResult.length,
      activeBoosts: activeBoosts.length,
      boostStats: {
        totalDuration: allBoostsResult.reduce((sum: number, boost: any) => sum + boost.duration_hours, 0),
        activeDuration: activeBoosts.reduce((sum: number, boost: any) => sum + boost.duration_hours, 0),
      },
    };
  } catch (error) {
    throw new AppError('Failed to get boost statistics', 500);
  }
};