CREATE TABLE "DidcommPrivateMediaSharing" (
	"context_correlation_id" text NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"metadata" jsonb,
	"custom_tags" jsonb,
	"user_id" text NOT NULL,
	"description" text,
	"thread_id" text,
	"parent_thread_id" text,
	"items" jsonb,
	"version" text,
	CONSTRAINT "didcommPrivateMediaSharing_pk" PRIMARY KEY("context_correlation_id","id"),
	CONSTRAINT "DidcommPrivateMediaSharing_context_correlation_id_thread_id_unique" UNIQUE("context_correlation_id","thread_id")
);
--> statement-breakpoint
ALTER TABLE "DidcommPrivateMediaSharing" ADD CONSTRAINT "didcommPrivateMediaSharing_fk_context" FOREIGN KEY ("context_correlation_id") REFERENCES "public"."Context"("context_correlation_id") ON DELETE cascade ON UPDATE no action;