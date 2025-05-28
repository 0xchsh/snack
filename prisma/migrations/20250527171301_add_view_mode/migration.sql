-- CreateEnum
CREATE TYPE "ViewMode" AS ENUM ('LIST', 'GALLERY');

-- AlterTable
ALTER TABLE "List" ADD COLUMN     "viewMode" "ViewMode" NOT NULL DEFAULT 'LIST';
