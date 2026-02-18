-- AlterTable
ALTER TABLE `news` ADD COLUMN `category` VARCHAR(50) NOT NULL DEFAULT 'general',
    ADD COLUMN `viewCount` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `news_category_idx` ON `news`(`category`);
