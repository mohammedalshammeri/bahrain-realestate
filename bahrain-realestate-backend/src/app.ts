import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import { errorHandler, AppError } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

// Import routes
import authRoutes from "./routes/auth.routes";
import adminRoutes from "./routes/admin.routes";
import companyRoutes from "./routes/company.routes";
import publicRoutes from "./routes/public.routes";
import employeeRoutes from "./routes/employee.routes";
import individualRoutes from "./routes/individual.routes";

const app: Express = express();

// Trust first proxy (nginx, ALB, etc.) so rate-limiter + IP detection work behind reverse proxy
if (isProduction) {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet());

// CORS — restrict origins in production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8081'];

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
}));

// Body parsers — file uploads go through multer, NOT JSON body
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// HTTP request logging
app.use(morgan(isProduction ? 'combined' : 'dev'));

// Global API rate limiter (100 req/min per IP)
app.use('/api', apiLimiter);

// Serve uploads directory with cache headers
const uploadsPath = path.join(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsPath, {
  maxAge: isProduction ? '7d' : 0,
  etag: true,
  lastModified: true,
  setHeaders: (res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
  },
}));

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
