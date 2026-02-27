CREATE TABLE `pageContentRevisions` (
	`id` varchar(64) NOT NULL,
	`section` varchar(128) NOT NULL,
	`title` text,
	`content` text NOT NULL,
	`imageUrl` text,
	`metadata` json,
	`revisionNumber` int NOT NULL,
	`status` enum('draft','published','archived') NOT NULL DEFAULT 'draft',
	`editorUserId` int,
	`publishedAt` timestamp,
	`rolledBackFromRevisionId` varchar(64),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `pageContentRevisions_id` PRIMARY KEY(`id`),
	CONSTRAINT `pageContentRevisions_section_revision_unique` UNIQUE(`section`,`revisionNumber`)
);
--> statement-breakpoint
CREATE TABLE `productOemIndex` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productId` varchar(64) NOT NULL,
	`manufacturer` varchar(128) NOT NULL,
	`code` varchar(255) NOT NULL,
	`normalizedManufacturer` varchar(128) NOT NULL,
	`normalizedCode` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `productOemIndex_id` PRIMARY KEY(`id`),
	CONSTRAINT `productOemIndex_product_code_unique` UNIQUE(`productId`,`normalizedManufacturer`,`normalizedCode`)
);
--> statement-breakpoint
INSERT INTO `pageContentRevisions` (
	`id`,
	`section`,
	`title`,
	`content`,
	`imageUrl`,
	`metadata`,
	`revisionNumber`,
	`status`,
	`editorUserId`,
	`publishedAt`,
	`rolledBackFromRevisionId`,
	`createdAt`,
	`updatedAt`
)
SELECT
	`id`,
	`section`,
	`title`,
	`content`,
	`imageUrl`,
	`metadata`,
	1,
	'published',
	NULL,
	COALESCE(`updatedAt`, `createdAt`),
	NULL,
	`createdAt`,
	`updatedAt`
FROM `pageContent`;
--> statement-breakpoint
CREATE INDEX `pageContentRevisions_section_status_idx` ON `pageContentRevisions` (`section`,`status`);--> statement-breakpoint
CREATE INDEX `pageContentRevisions_section_updatedAt_idx` ON `pageContentRevisions` (`section`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `productOemIndex_normalizedCode_idx` ON `productOemIndex` (`normalizedCode`);--> statement-breakpoint
CREATE INDEX `productOemIndex_normalizedManufacturer_idx` ON `productOemIndex` (`normalizedManufacturer`);--> statement-breakpoint
CREATE INDEX `productOemIndex_productId_idx` ON `productOemIndex` (`productId`);
