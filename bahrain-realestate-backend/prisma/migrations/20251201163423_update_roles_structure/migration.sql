/*
  Warnings:

  - The values [manager,agent] on the enum `company_employee_role` will be removed. If these variants are still used in the database, this will fail.
  - The `role` column on the `admins` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "system_role" AS ENUM ('SUPER_ADMIN', 'ADMIN');

-- AlterEnum
BEGIN;
CREATE TYPE "company_employee_role_new" AS ENUM ('OWNER', 'MANAGER', 'AGENT');
ALTER TABLE "public"."company_employees" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "company_employees" ALTER COLUMN "role" TYPE "company_employee_role_new" USING ("role"::text::"company_employee_role_new");
ALTER TYPE "company_employee_role" RENAME TO "company_employee_role_old";
ALTER TYPE "company_employee_role_new" RENAME TO "company_employee_role";
DROP TYPE "public"."company_employee_role_old";
ALTER TABLE "company_employees" ALTER COLUMN "role" SET DEFAULT 'AGENT';
COMMIT;

-- AlterTable
ALTER TABLE "admins" DROP COLUMN "role",
ADD COLUMN     "role" "system_role" NOT NULL DEFAULT 'SUPER_ADMIN';

-- AlterTable
ALTER TABLE "company_employees" ALTER COLUMN "role" SET DEFAULT 'AGENT';
