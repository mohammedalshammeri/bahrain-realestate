CREATE TYPE "public"."company_status" AS ENUM('pending', 'approved', 'rejected', 'blocked');--> statement-breakpoint
CREATE TYPE "public"."complaint_status" AS ENUM('new', 'under_review', 'resolved');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."property_purpose" AS ENUM('sale', 'rent');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'sold', 'rented', 'expired');--> statement-breakpoint
CREATE TABLE "admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"role" varchar(50) DEFAULT 'super_admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" serial PRIMARY KEY NOT NULL,
	"governorate_id" integer NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"cr_number" varchar(100) NOT NULL,
	"license_image_url" text,
	"email" varchar(320) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"password_hash" text NOT NULL,
	"status" "company_status" DEFAULT 'pending' NOT NULL,
	"employees_limit" integer DEFAULT 5 NOT NULL,
	"free_ads_remaining" integer DEFAULT 50 NOT NULL,
	"featured_ads_balance" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_cr_number_unique" UNIQUE("cr_number"),
	CONSTRAINT "companies_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "complaints" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"user_phone" varchar(50) NOT NULL,
	"user_email" varchar(320),
	"message" text NOT NULL,
	"status" "complaint_status" DEFAULT 'new' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "governorates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name_ar" varchar(100) NOT NULL,
	"name_en" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"package_type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar(50) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'pending' NOT NULL,
	"transaction_id" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_transaction_id_unique" UNIQUE("transaction_id")
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"company_id" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"purpose" "property_purpose" NOT NULL,
	"price" numeric(12, 2) NOT NULL,
	"governorate" varchar(100) NOT NULL,
	"area" varchar(100) NOT NULL,
	"branch" varchar(100),
	"description" text NOT NULL,
	"location_lat" numeric(10, 8),
	"location_lng" numeric(11, 8),
	"bedrooms" integer,
	"bathrooms" integer,
	"area_sqm" integer,
	"is_featured" boolean DEFAULT false NOT NULL,
	"status" "property_status" DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_key_unique" UNIQUE("key")
);
