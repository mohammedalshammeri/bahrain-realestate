ALTER TABLE "complaints" ADD COLUMN IF NOT EXISTS "property_id" INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'complaints_property_id_fkey'
  ) THEN
    ALTER TABLE "complaints"
    ADD CONSTRAINT "complaints_property_id_fkey"
    FOREIGN KEY ("property_id")
    REFERENCES "properties"("id")
    ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "complaints_property_id_idx" ON "complaints"("property_id");
