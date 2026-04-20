CREATE TABLE `productImportJobs` (
  `id` varchar(64) NOT NULL,
  `sourceType` varchar(64) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileHash` varchar(64) NOT NULL,
  `filePath` text NOT NULL,
  `status` enum('queued','running','completed','failed','cancelled') NOT NULL DEFAULT 'queued',
  `totalRows` int NOT NULL DEFAULT 0,
  `processedRows` int NOT NULL DEFAULT 0,
  `createdCount` int NOT NULL DEFAULT 0,
  `updatedCount` int NOT NULL DEFAULT 0,
  `skippedCount` int NOT NULL DEFAULT 0,
  `lastProcessedKey` varchar(191),
  `chunkSize` int NOT NULL DEFAULT 1000,
  `errorMessage` text,
  `startedAt` timestamp NULL,
  `finishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `productImportJobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `productImportJobs_status_idx` ON `productImportJobs` (`status`);
--> statement-breakpoint
CREATE INDEX `productImportJobs_fileHash_idx` ON `productImportJobs` (`fileHash`);
--> statement-breakpoint
CREATE INDEX `productImportJobs_createdAt_idx` ON `productImportJobs` (`createdAt`);
