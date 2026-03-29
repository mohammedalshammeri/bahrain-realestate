-- Individual users (for individual-submitted properties)
CREATE TABLE IF NOT EXISTS "individual_users" (
  "id" SERIAL PRIMARY KEY,
  "full_name" TEXT,
  "phone" VARCHAR(50) UNIQUE,
  "email" VARCHAR(320) UNIQUE,
  "password_hash" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Enum for individual property workflow status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'individual_property_status') THEN
    CREATE TYPE "individual_property_status" AS ENUM (
      'PENDING_ADMIN',
      'SENT_TO_COMPANIES',
      'ACTIVE',
      'REJECTED'
    );
  END IF;
END $$;

-- Individual-submitted properties (NOT published directly)
CREATE TABLE IF NOT EXISTS "individual_properties" (
  "id" SERIAL PRIMARY KEY,
  "owner_individual_id" INTEGER NOT NULL,
  "title" VARCHAR(255),
  "description" TEXT NOT NULL,
  "type" VARCHAR(50) NOT NULL,
  "purpose" "property_purpose" NOT NULL,
  "minimum_price" DECIMAL(12,2) NOT NULL,
  "governorate" VARCHAR(100) NOT NULL,
  "area" VARCHAR(100) NOT NULL,
  "branch" VARCHAR(100),
  "location_lat" DECIMAL(10,8),
  "location_lng" DECIMAL(11,8),
  "bedrooms" INTEGER,
  "bathrooms" INTEGER,
  "area_sqm" INTEGER,
  "furnishing_status" VARCHAR(50),
  "floors_count" INTEGER,
  "floor_number" INTEGER,
  "living_rooms" INTEGER,
  "building_age" INTEGER,
  "negotiable" BOOLEAN NOT NULL DEFAULT FALSE,
  "parking_count" INTEGER,
  "condition" VARCHAR(50),
  "show_phone" BOOLEAN NOT NULL DEFAULT TRUE,
  "enable_whatsapp" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" "individual_property_status" NOT NULL DEFAULT 'PENDING_ADMIN',
  "admin_rejection_reason" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "individual_properties_owner_individual_id_fkey" FOREIGN KEY ("owner_individual_id") REFERENCES "individual_users"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "individual_properties_owner_individual_id_idx" ON "individual_properties"("owner_individual_id");
