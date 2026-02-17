-- AlterTable
ALTER TABLE `slides` ADD COLUMN `bgGradient` VARCHAR(500) NULL,
    ADD COLUMN `ctaText` VARCHAR(100) NULL,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `subtitle` VARCHAR(255) NULL,
    ADD COLUMN `title` VARCHAR(255) NULL;
