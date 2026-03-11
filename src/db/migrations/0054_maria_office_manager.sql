-- Phase 8: Maria — AI Office Manager
-- 4 new tables: chat_messages, business_context_notes, conversation_summaries, weather_cache

CREATE TABLE `chat_messages` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `role` text NOT NULL DEFAULT 'user',
  `content` text NOT NULL,
  `channel` text NOT NULL DEFAULT 'dashboard',
  `tool_calls` text DEFAULT NULL,
  `tool_results` text DEFAULT NULL,
  `token_count` integer DEFAULT 0,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `business_context_notes` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `category` text NOT NULL DEFAULT 'context',
  `content` text NOT NULL,
  `source` text NOT NULL DEFAULT 'auto',
  `expires_at` text DEFAULT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now')),
  `updated_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `conversation_summaries` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  `business_id` text NOT NULL REFERENCES `businesses`(`id`),
  `channel` text NOT NULL DEFAULT 'dashboard',
  `summary` text NOT NULL,
  `message_count` integer NOT NULL DEFAULT 0,
  `oldest_message_at` text NOT NULL,
  `newest_message_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE `weather_cache` (
  `id` text PRIMARY KEY NOT NULL DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1,1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
  `location_key` text NOT NULL,
  `lat` real NOT NULL,
  `lon` real NOT NULL,
  `data` text NOT NULL,
  `expires_at` text NOT NULL,
  `created_at` text NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX `idx_chat_messages_business_created` ON `chat_messages` (`business_id`, `created_at`);
CREATE INDEX `idx_chat_messages_channel` ON `chat_messages` (`business_id`, `channel`, `created_at`);
CREATE INDEX `idx_context_notes_business` ON `business_context_notes` (`business_id`, `category`);
CREATE INDEX `idx_conv_summaries_business` ON `conversation_summaries` (`business_id`, `channel`);
CREATE INDEX `idx_weather_cache_location` ON `weather_cache` (`location_key`);
CREATE INDEX `idx_weather_cache_expires` ON `weather_cache` (`expires_at`);
