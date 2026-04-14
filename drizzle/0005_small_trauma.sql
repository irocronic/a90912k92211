ALTER TABLE `products` ADD `sourceType` varchar(64);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceImportKey` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceLogicalRef` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceCode` varchar(255);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceSpecCode` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceBrand` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceBrandId` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceOtoUrunLogref` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceKayitUrunLogref` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceRegion` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceChannel` varchar(191);--> statement-breakpoint
ALTER TABLE `products` ADD `sourceVisibility` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceIsVirtual` int;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceData` json;--> statement-breakpoint
ALTER TABLE `products` ADD `sourceLastImportedAt` timestamp;--> statement-breakpoint
ALTER TABLE `products` ADD CONSTRAINT `products_sourceImportKey_unique` UNIQUE(`sourceImportKey`);--> statement-breakpoint
CREATE INDEX `products_sourceCode_idx` ON `products` (`sourceCode`);--> statement-breakpoint
CREATE INDEX `products_sourceBrand_idx` ON `products` (`sourceBrand`);