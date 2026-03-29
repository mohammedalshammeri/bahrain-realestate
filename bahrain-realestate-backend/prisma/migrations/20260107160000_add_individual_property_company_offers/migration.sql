-- Enum for company offers on individual properties
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'individual_property_company_offer_status') THEN
    CREATE TYPE "individual_property_company_offer_status" AS ENUM (
      'PENDING',
      'ACCEPTED',
      'REJECTED'
    );
  END IF;
END $$;

-- Join table: IndividualProperty <-> Company offers
CREATE TABLE IF NOT EXISTS "individual_property_company_offers" (
  "id" SERIAL PRIMARY KEY,
  "company_id" INTEGER NOT NULL,
  "property_id" INTEGER NOT NULL,
  "company_price" DECIMAL(12,2),
  "status" "individual_property_company_offer_status" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "individual_property_company_offers_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE,
  CONSTRAINT "individual_property_company_offers_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "individual_properties"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "individual_property_company_offers_company_id_property_id_key" ON "individual_property_company_offers"("company_id", "property_id");
CREATE INDEX IF NOT EXISTS "individual_property_company_offers_company_id_idx" ON "individual_property_company_offers"("company_id");
CREATE INDEX IF NOT EXISTS "individual_property_company_offers_property_id_idx" ON "individual_property_company_offers"("property_id");
