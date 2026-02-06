CREATE TABLE `DidcommPrivateMediaSharing` (
	`context_correlation_id` text NOT NULL,
	`id` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`metadata` text,
	`custom_tags` text,
	`user_id` text NOT NULL,
	`description` text,
	`thread_id` text,
	`parent_thread_id` text,
	`items` text,
	`version` text,
	PRIMARY KEY(`context_correlation_id`, `id`),
	FOREIGN KEY (`context_correlation_id`) REFERENCES `Context`(`context_correlation_id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `DidcommPrivateMediaSharing_context_correlation_id_thread_id_unique` ON `DidcommPrivateMediaSharing` (`context_correlation_id`,`thread_id`);