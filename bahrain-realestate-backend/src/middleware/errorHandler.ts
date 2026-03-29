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
  console.error("Error:", error);

  const status = error.status || 500;
  const message = error.message || "Internal Server Error";
  const code = error.code || "INTERNAL_ERROR";

  res.status(status).json({
    success: false,
    code,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
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
