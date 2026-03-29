-- Add MVP-compatible fields for properties
ALTER TABLE "properties"
  ADD COLUMN IF NOT EXISTS "title" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "negotiable" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "parking_count" INTEGER,
  ADD COLUMN IF NOT EXISTS "condition" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "show_phone" BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS "enable_whatsapp" BOOLEAN NOT NULL DEFAULT TRUE;

-- Add MVP-compatible fields for ads
ALTER TABLE "ads"
  ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS "is_deleted" BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill new flags from existing legacy columns
UPDATE "ads" SET "is_featured" = (LOWER(COALESCE("type", '')) = 'featured');
UPDATE "ads" SET "is_deleted"  = (LOWER(COALESCE("status", '')) = 'deleted');
