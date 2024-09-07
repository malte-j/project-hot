CREATE TABLE `messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`message` text,
	`images` text,
	`createdAt` text DEFAULT (current_timestamp) NOT NULL,
	`readAt` text
);
