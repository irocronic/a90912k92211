ALTER TABLE `users`
  ADD COLUMN `passwordHash` text,
  ADD COLUMN `passwordResetRequired` int NOT NULL DEFAULT 0,
  ADD COLUMN `passwordUpdatedAt` timestamp NULL;
