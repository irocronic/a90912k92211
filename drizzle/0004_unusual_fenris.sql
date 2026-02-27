CREATE TABLE `auditLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorUserId` int NOT NULL,
	`actorRole` varchar(32) NOT NULL,
	`action` varchar(191) NOT NULL,
	`resource` varchar(128) NOT NULL,
	`resourceId` varchar(128),
	`status` enum('success','error','denied') NOT NULL DEFAULT 'success',
	`metadata` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `auditLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','content_editor','super_admin','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
UPDATE `users` SET `role` = 'super_admin' WHERE `role` = 'admin';--> statement-breakpoint
CREATE INDEX `auditLogs_createdAt_idx` ON `auditLogs` (`createdAt`);--> statement-breakpoint
CREATE INDEX `auditLogs_actorUserId_idx` ON `auditLogs` (`actorUserId`);--> statement-breakpoint
CREATE INDEX `auditLogs_action_idx` ON `auditLogs` (`action`);--> statement-breakpoint
CREATE INDEX `auditLogs_resource_idx` ON `auditLogs` (`resource`);--> statement-breakpoint
CREATE INDEX `auditLogs_status_idx` ON `auditLogs` (`status`);
