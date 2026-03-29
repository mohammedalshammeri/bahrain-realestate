CREATE TABLE IF NOT EXISTS "individual_property_videos" (
  "id" SERIAL PRIMARY KEY,
  "property_id" INTEGER NOT NULL,
  "video_url" TEXT NOT NULL,
  "display_order" INTEGER NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT "individual_property_videos_property_id_fkey"
    FOREIGN KEY ("property_id")
    REFERENCES "individual_properties"("id")
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "individual_property_videos_property_id_idx" ON "individual_property_videos"("property_id");
