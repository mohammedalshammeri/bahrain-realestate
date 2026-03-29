ALTER TYPE "public"."property_status" ADD VALUE 'pending' BEFORE 'sold';--> statement-breakpoint
ALTER TYPE "public"."property_status" ADD VALUE 'rejected' BEFORE 'sold';--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "status" SET DEFAULT 'pending';