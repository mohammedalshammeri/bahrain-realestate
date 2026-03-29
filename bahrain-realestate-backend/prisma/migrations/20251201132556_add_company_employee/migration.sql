-- CreateEnum
CREATE TYPE "company_employee_role" AS ENUM ('manager', 'agent');

-- CreateTable
CREATE TABLE "company_employees" (
    "id" SERIAL NOT NULL,
    "company_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "email" VARCHAR(320) NOT NULL,
    "phone" VARCHAR(50),
    "role" "company_employee_role" NOT NULL DEFAULT 'agent',
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "company_employees_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "company_employees_company_id_idx" ON "company_employees"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "company_employees_company_id_email_key" ON "company_employees"("company_id", "email");

-- AddForeignKey
ALTER TABLE "company_employees" ADD CONSTRAINT "company_employees_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
