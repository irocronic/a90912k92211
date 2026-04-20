CREATE TABLE `productImportLogs` (
  `id` varchar(64) NOT NULL,
  `sourceType` varchar(64) NOT NULL,
  `fileName` varchar(255) NOT NULL,
  `fileHash` varchar(64) NOT NULL,
  `totalRows` int NOT NULL,
  `importedRows` int NOT NULL,
  `skippedRows` int NOT NULL,
  `createdCount` int NOT NULL,
  `updatedCount` int NOT NULL,
  `detectedTables` json NOT NULL,
  `detectedProductColumns` json NOT NULL,
  `importedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `productImportLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `productImportLogs_fileHash_idx` ON `productImportLogs` (`fileHash`);
--> statement-breakpoint
CREATE INDEX `productImportLogs_importedAt_idx` ON `productImportLogs` (`importedAt`);
