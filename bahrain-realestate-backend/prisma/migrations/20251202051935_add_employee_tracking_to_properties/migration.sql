/*
  Warnings:

  - Added the required column `created_by_employee_id` to the `properties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `created_by_employee_id` to the `property_images` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "created_by_employee_id" INTEGER NOT NULL,
ADD COLUMN     "updated_by_employee_id" INTEGER;

-- AlterTable
ALTER TABLE "property_images" ADD COLUMN     "created_by_employee_id" INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX "properties_created_by_employee_id_idx" ON "properties"("created_by_employee_id");

-- CreateIndex
CREATE INDEX "properties_updated_by_employee_id_idx" ON "properties"("updated_by_employee_id");

-- CreateIndex
CREATE INDEX "property_images_created_by_employee_id_idx" ON "property_images"("created_by_employee_id");

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "company_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "properties" ADD CONSTRAINT "properties_updated_by_employee_id_fkey" FOREIGN KEY ("updated_by_employee_id") REFERENCES "company_employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_created_by_employee_id_fkey" FOREIGN KEY ("created_by_employee_id") REFERENCES "company_employees"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
