CREATE TABLE `used_magic_tokens` (
  `id` text PRIMARY KEY NOT NULL,
  `token_hash` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text DEFAULT (datetime('now'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `used_magic_tokens_token_hash_unique` ON `used_magic_tokens` (`token_hash`);
