DELETE t1
FROM `translations` t1
INNER JOIN `translations` t2
  ON t1.`key` = t2.`key`
 AND t1.`language` = t2.`language`
 AND t1.`section` = t2.`section`
 AND (
  t1.`updatedAt` < t2.`updatedAt`
  OR (t1.`updatedAt` = t2.`updatedAt` AND t1.`id` < t2.`id`)
 );
--> statement-breakpoint
DELETE p1
FROM `userPreferences` p1
INNER JOIN `userPreferences` p2
  ON p1.`userId` = p2.`userId`
 AND (
  p1.`updatedAt` < p2.`updatedAt`
  OR (p1.`updatedAt` = p2.`updatedAt` AND p1.`id` < p2.`id`)
 );
--> statement-breakpoint
ALTER TABLE `translations` ADD CONSTRAINT `translations_key_language_section_unique` UNIQUE(`key`,`language`,`section`);
--> statement-breakpoint
ALTER TABLE `userPreferences` ADD CONSTRAINT `userPreferences_userId_unique` UNIQUE(`userId`);
