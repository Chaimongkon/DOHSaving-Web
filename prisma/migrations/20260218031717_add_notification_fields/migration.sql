-- AlterTable
ALTER TABLE `notifications` ADD COLUMN `clickCount` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `endDate` DATE NULL,
    ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `startDate` DATE NULL,
    ADD COLUMN `title` VARCHAR(255) NULL;

-- CreateIndex
CREATE INDEX `notifications_sortOrder_idx` ON `notifications`(`sortOrder`);
