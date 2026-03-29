import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../config/jwt";

export interface AuthRequest extends Request {
  user?: any;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const superAdminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (decoded.role !== "SUPER_ADMIN") {
      return res
        .status(403)
        .json({ message: "Only super admin can access this resource" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const companyEmployeeAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (decoded.role !== "employee") {
      return res
        .status(403)
        .json({ message: "Only company employees can access this resource" });
    }

    if (!["OWNER", "MANAGER", "AGENT"].includes(decoded.employeeRole)) {
      return res
        .status(403)
        .json({ message: "Invalid employee role" });
    }

    req.user = decoded;
    next();
  } catch (error: any) {
    console.error("Company Employee Auth Error:", error.message);
    res.status(401).json({ message: error.message || "Invalid or expired token" });
  }
};

export const companyOwnerAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (decoded.role !== "employee" || decoded.employeeRole !== "OWNER") {
      return res
        .status(403)
        .json({ message: "Only company owner can access this resource" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const companyManagerAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (decoded.role !== "employee" || !["OWNER", "MANAGER"].includes(decoded.employeeRole)) {
      return res
        .status(403)
        .json({ message: "Only company owner or manager can access this resource" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (!["ADMIN", "SUPER_ADMIN"].includes(decoded.role)) {
      return res
        .status(403)
        .json({ message: "Only admins can access this resource" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const individualAuthMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded: any = verifyToken(token);

    if (decoded.role !== "individual" || !decoded.individualId) {
      return res
        .status(403)
        .json({ message: "Only individual users can access this resource" });
    }

    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
};
