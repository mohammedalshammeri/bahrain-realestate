-- Add SOLD status to individual_property_status enum
ALTER TYPE "individual_property_status" ADD VALUE IF NOT EXISTS 'SOLD';
