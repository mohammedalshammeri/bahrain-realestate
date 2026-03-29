import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { errorHandler, AppError } from "./middleware/errorHandler";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import companyRoutes from "./routes/company.routes";
import publicRoutes from "./routes/public.routes";
import employeeRoutes from "./routes/employee.routes";
import individualRoutes from "./routes/individual.routes";

const app: Express = express();

// Middleware
app.use(cors());
// Increased body size limits for multiple video uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ extended: true, limit: '500mb' }));

// Serve uploads directory - absolute path to ensure reliability
const uploadsPath = path.join(process.cwd(), 'uploads');
console.log(`Serving static files from: ${uploadsPath}`);
app.use('/uploads', express.static(uploadsPath));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/individual", individualRoutes);

// Welcome page
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "🏠 Bahrain Property Hub API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      admin: "/api/admin", 
      company: "/api/company",
      public: "/api/public",
      employee: "/api/employee",
      individual: "/api/individual",
      health: "/health"
    },
    documentation: "Check API_DOCUMENTATION.md for detailed endpoints"
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.path,
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);

  // In production we fail-fast so the process manager can restart us.
  // In development, exiting causes flaky local/mobile testing (e.g. Axios 'Network Error').
  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  if (process.env.NODE_ENV === "production") {
    process.exit(1);
  }
});

export default app;
