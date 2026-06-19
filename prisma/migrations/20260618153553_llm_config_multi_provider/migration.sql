/*
  Warnings:

  - You are about to drop the column `activeModelIndex` on the `LlmConfig` table. All the data in the column will be lost.
  - You are about to drop the column `models` on the `LlmConfig` table. All the data in the column will be lost.
  - Added the required column `label` to the `LlmConfig` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model` to the `LlmConfig` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "LlmConfig" DROP COLUMN "activeModelIndex",
DROP COLUMN "models",
ADD COLUMN     "label" TEXT NOT NULL,
ADD COLUMN     "model" TEXT NOT NULL;
