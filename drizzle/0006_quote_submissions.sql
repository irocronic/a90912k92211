CREATE TABLE `quoteSubmissions` (
  `id` varchar(64) NOT NULL,
  `name` varchar(191) NOT NULL,
  `email` varchar(320) NOT NULL,
  `phone` varchar(64) NOT NULL DEFAULT '',
  `subject` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `pageUrl` text,
  `status` enum('new','emailed','email_failed') NOT NULL DEFAULT 'new',
  `mailProvider` varchar(64),
  `mailMessageId` varchar(191),
  `mailError` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `quoteSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `quoteSubmissions_createdAt_idx` ON `quoteSubmissions` (`createdAt`);
--> statement-breakpoint
CREATE INDEX `quoteSubmissions_status_idx` ON `quoteSubmissions` (`status`);
--> statement-breakpoint
CREATE INDEX `quoteSubmissions_email_idx` ON `quoteSubmissions` (`email`);
