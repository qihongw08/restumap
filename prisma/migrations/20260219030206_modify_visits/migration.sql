-- AlterTable
ALTER TABLE "photos" ADD COLUMN     "visit_id" TEXT;

-- AlterTable
ALTER TABLE "visits" ADD COLUMN     "group_id" TEXT;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "photos" ADD CONSTRAINT "photos_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "visits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
