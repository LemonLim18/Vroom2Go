-- AlterTable
ALTER TABLE `messages` ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `reply_to_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('BOOKING', 'QUOTE', 'MESSAGE', 'REVIEW', 'PAYMENT', 'SYSTEM', 'SHOP_VERIFIED', 'DISPUTE_RESOLVED') NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `is_online` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `last_active` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `time_slots` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `shop_id` INTEGER NOT NULL,
    `date` DATE NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `is_booked` BOOLEAN NOT NULL DEFAULT false,
    `booking_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `time_slots_booking_id_key`(`booking_id`),
    INDEX `time_slots_shop_id_date_idx`(`shop_id`, `date`),
    UNIQUE INDEX `time_slots_shop_id_date_start_time_key`(`shop_id`, `date`, `start_time`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `time_slots` ADD CONSTRAINT `time_slots_shop_id_fkey` FOREIGN KEY (`shop_id`) REFERENCES `shops`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `time_slots` ADD CONSTRAINT `time_slots_booking_id_fkey` FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `messages` ADD CONSTRAINT `messages_reply_to_id_fkey` FOREIGN KEY (`reply_to_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
