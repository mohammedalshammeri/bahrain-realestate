/*
  Warnings:

  - You are about to drop the column `password_hash` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "companies" DROP COLUMN "password_hash";
