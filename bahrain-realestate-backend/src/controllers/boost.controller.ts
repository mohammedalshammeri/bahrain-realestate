import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import {
  createBoost,
  getCompanyActiveBoosts,
  getCompanyBoosts,
  cancelBoost,
  extendBoost,
  getBoostWithDetails,
  getCompanyBoostStats,
} from '../services/boost.service';
import { AppError } from '../middleware/errorHandler';

// Create a new boost
export const createBoostController = async (req: AuthRequest, res: Response) => {
  try {
    const { propertyId, durationHours, paymentId } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    if (!propertyId || !durationHours) {
      throw new AppError('Missing required fields', 400);
    }

    if (durationHours < 1 || durationHours > 720) { // Max 30 days
      throw new AppError('Duration must be between 1 and 720 hours', 400);
    }

    const boost = await createBoost({
      propertyId: parseInt(propertyId),
      companyId,
      durationHours: parseInt(durationHours),
      paymentId: paymentId ? parseInt(paymentId) : undefined,
    });

    res.status(201).json({
      success: true,
      data: boost,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get active boosts for company
export const getCompanyActiveBoostsController = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const boosts = await getCompanyActiveBoosts(companyId);

    res.json({
      success: true,
      data: boosts,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get all boosts for company (paginated)
export const getCompanyBoostsController = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const boosts = await getCompanyBoosts(companyId, skip, limit);

    res.json({
      success: true,
      data: {
        boosts,
        pagination: {
          page,
          limit,
          total: boosts.length, // In production, you'd want a separate count query
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get specific boost details
export const getBoostController = async (req: AuthRequest, res: Response) => {
  try {
    const boostId = parseInt(req.params.id);
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const boost = await getBoostWithDetails(boostId);

    if (!boost || boost.companyId !== companyId) {
      throw new AppError('Boost not found', 404);
    }

    res.json({
      success: true,
      data: boost,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Cancel a boost
export const cancelBoostController = async (req: AuthRequest, res: Response) => {
  try {
    const boostId = parseInt(req.params.id);
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    await cancelBoost(boostId, companyId);

    res.json({
      success: true,
      message: 'Boost cancelled successfully',
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Extend a boost
export const extendBoostController = async (req: AuthRequest, res: Response) => {
  try {
    const boostId = parseInt(req.params.id);
    const { additionalHours } = req.body;
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    if (!additionalHours || additionalHours < 1 || additionalHours > 720) {
      throw new AppError('Additional hours must be between 1 and 720', 400);
    }

    const updatedBoost = await extendBoost(boostId, parseInt(additionalHours), companyId);

    res.json({
      success: true,
      data: updatedBoost,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};

// Get boost statistics for company
export const getCompanyBoostStatsController = async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    if (!companyId) {
      throw new AppError('Company not authenticated', 401);
    }

    const stats = await getCompanyBoostStats(companyId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    if (error instanceof AppError) {
      res.status(error.status).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }
};
