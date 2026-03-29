import { pgTable, serial, varchar, text, timestamp, integer, decimal, boolean, pgEnum } from "drizzle-orm/pg-core";

export const companyStatusEnum = pgEnum("company_status", ["pending", "approved", "rejected", "blocked"]);
export const propertyPurposeEnum = pgEnum("property_purpose", ["sale", "rent"]);
export const propertyStatusEnum = pgEnum("property_status", ["active", "pending", "rejected", "sold", "rented", "expired"]);
export const complaintStatusEnum = pgEnum("complaint_status", ["new", "under_review", "resolved"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "processing", "completed", "failed", "cancelled", "refunded"]);
export const notificationTypeEnum = pgEnum("notification_type", ["property_approved", "property_rejected", "featured_expired", "account_status_changed", "featured_activated", "payment_received", "boost_expired", "system"]);
export const featuredStatusEnum = pgEnum("featured_status", ["active", "expired", "cancelled"]);
export const boostStatusEnum = pgEnum("boost_status", ["active", "expired", "cancelled"]);
export const pushNotificationStatusEnum = pgEnum("push_notification_status", ["pending", "sent", "failed"]);

export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 50 }).default("super_admin").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  crNumber: varchar("cr_number", { length: 100 }).notNull().unique(),
  licenseImageUrl: text("license_image_url"),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }).notNull(),
  passwordHash: text("password_hash").notNull(),
  status: companyStatusEnum("status").default("pending").notNull(),
  employeesLimit: integer("employees_limit").default(5).notNull(),
  freeAdsRemaining: integer("free_ads_remaining").default(50).notNull(),
  featuredAdsBalance: integer("featured_ads_balance").default(0).notNull(),
  subscriptionPlan: varchar("subscription_plan", { length: 50 }).default("free"),
  subscriptionStartDate: timestamp("subscription_start_date"),
  subscriptionEndDate: timestamp("subscription_end_date"),
  subscriptionStatus: varchar("subscription_status", { length: 20 }).default("active"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  purpose: propertyPurposeEnum("purpose").notNull(),
  price: decimal("price", { precision: 12, scale: 2 }).notNull(),
  governorate: varchar("governorate", { length: 100 }).notNull(),
  area: varchar("area", { length: 100 }).notNull(),
  branch: varchar("branch", { length: 100 }),
  description: text("description").notNull(),
  locationLat: decimal("location_lat", { precision: 10, scale: 8 }),
  locationLng: decimal("location_lng", { precision: 11, scale: 8 }),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  areaSqm: integer("area_sqm"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  status: propertyStatusEnum("status").default("pending").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const propertyImages = pgTable("property_images", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  imageUrl: text("image_url").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const complaints = pgTable("complaints", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  userPhone: varchar("user_phone", { length: 50 }).notNull(),
  userEmail: varchar("user_email", { length: 320 }),
  message: text("message").notNull(),
  status: complaintStatusEnum("status").default("new").notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  packageType: varchar("package_type", { length: 50 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("pending").notNull(),
  transactionId: varchar("transaction_id", { length: 255 }).unique(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const governorates = pgTable("governorates", {
  id: serial("id").primaryKey(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
});

export const areas = pgTable("areas", {
  id: serial("id").primaryKey(),
  governorateId: integer("governorate_id").notNull(),
  nameAr: varchar("name_ar", { length: 100 }).notNull(),
  nameEn: varchar("name_en", { length: 100 }).notNull(),
});

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string for additional data
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const featuredPackages = pgTable("featured_packages", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  companyId: integer("company_id").notNull(),
  duration: integer("duration").notNull(), // in days
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: featuredStatusEnum("status").default("active").notNull(),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Phase 4: Enhanced Payments & Growth Features
export const enhancedPayments = pgTable("enhanced_payments", {
  id: serial("id").primaryKey(),
  transactionId: varchar("transaction_id", { length: 255 }).notNull().unique(),
  companyId: integer("company_id").notNull(),
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BHD").notNull(),
  status: paymentStatusEnum("status").default("pending").notNull(),
  paymentMethod: varchar("payment_method", { length: 50 }).notNull(),
  gateway: varchar("gateway", { length: 50 }).notNull(), // 'afs', 'stripe', 'apple_pay', 'google_pay'
  gatewayTransactionId: varchar("gateway_transaction_id", { length: 255 }),
  gatewayResponse: text("gateway_response"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const paymentItems = pgTable("payment_items", {
  id: serial("id").primaryKey(),
  paymentId: integer("payment_id").notNull(),
  itemType: varchar("item_type", { length: 50 }).notNull(), // 'featured_package', 'boost'
  itemId: integer("item_id").notNull(), // ID of the featured package or boost
  amount: decimal("amount", { precision: 10, scale: 3 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boosts = pgTable("boosts", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull(),
  companyId: integer("company_id").notNull(),
  durationHours: integer("duration_hours").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: boostStatusEnum("status").default("active").notNull(),
  paymentId: integer("payment_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushTokens = pgTable("push_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  companyId: integer("company_id"),
  deviceToken: varchar("device_token", { length: 255 }).notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'ios', 'android'
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pushNotifications = pgTable("push_notifications", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  data: text("data"), // JSON string for additional data
  platform: varchar("platform", { length: 20 }), // 'ios', 'android', or null for both
  sentAt: timestamp("sent_at"),
  status: pushNotificationStatusEnum("status").default("pending").notNull(),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type PropertyImage = typeof propertyImages.$inferSelect;
export type Complaint = typeof complaints.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type Governorate = typeof governorates.$inferSelect;
export type Area = typeof areas.$inferSelect;
export type Setting = typeof settings.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type FeaturedPackage = typeof featuredPackages.$inferSelect;
export type EnhancedPayment = typeof enhancedPayments.$inferSelect;
export type PaymentItem = typeof paymentItems.$inferSelect;
export type Boost = typeof boosts.$inferSelect;
export type PushToken = typeof pushTokens.$inferSelect;
export type PushNotification = typeof pushNotifications.$inferSelect;
