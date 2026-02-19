/*
  Warnings:

  - You are about to drop the column `ambiance_rating` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `pf_ratio` on the `visits` table. All the data in the column will be lost.
  - You are about to drop the column `service_rating` on the `visits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "visits" DROP COLUMN "ambiance_rating",
DROP COLUMN "pf_ratio",
DROP COLUMN "service_rating";
