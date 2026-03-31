import { Request, Response, NextFunction } from "express";

interface ApiError extends Error {
  status?: number;
  code?: string;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = error.status || 500;
  const isProduction = process.env.NODE_ENV === "production";

  // Log full error details server-side
  if (isProduction) {
    console.error(`[ERROR] ${req.method} ${req.path} — ${status} — ${error.message}`);
  } else {
    console.error("Error:", error);
  }

  // In production, hide internal error messages for 500s
  const message = isProduction && status >= 500
    ? "Internal Server Error"
    : error.message || "Internal Server Error";
  const code = error.code || "INTERNAL_ERROR";

  res.status(status).json({
    success: false,
    code,
    message,
    ...(!isProduction && { stack: error.stack }),
  });
};

export class AppError extends Error {
  constructor(
    public message: string,
    public status: number = 500,
    public code: string = "APP_ERROR"
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
