/*
  Warnings:

  - You are about to drop the column `blacklist_reason` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `blacklisted_at` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `is_blacklisted` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `raw_caption` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `source_platform` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `source_url` on the `restaurants` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `restaurants` table. All the data in the column will be lost.
  - Added the required column `user_id` to the `imports` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `photos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `visits` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "imports" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "restaurants" DROP COLUMN "blacklist_reason",
DROP COLUMN "blacklisted_at",
DROP COLUMN "is_blacklisted",
DROP COLUMN "raw_caption",
DROP COLUMN "source_platform",
DROP COLUMN "source_url",
DROP COLUMN "status";

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "user_restaurants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "restaurant_id" TEXT NOT NULL,
    "status" "RestaurantStatus" NOT NULL DEFAULT 'WANT_TO_GO',
    "is_blacklisted" BOOLEAN NOT NULL DEFAULT false,
    "blacklist_reason" TEXT,
    "blacklisted_at" TIMESTAMP(3),
    "saved_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_url" TEXT,
    "source_platform" TEXT,
    "raw_caption" TEXT,

    CONSTRAINT "user_restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_restaurants_user_id_restaurant_id_key" ON "user_restaurants"("user_id", "restaurant_id");

-- AddForeignKey
ALTER TABLE "user_restaurants" ADD CONSTRAINT "user_restaurants_restaurant_id_fkey" FOREIGN KEY ("restaurant_id") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
