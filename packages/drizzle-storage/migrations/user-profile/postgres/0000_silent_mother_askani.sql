CREATE TABLE "UserProfile" (
	"context_correlation_id" text NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"metadata" jsonb,
	"custom_tags" jsonb,
	"display_name" text,
	"description" text,
	"preferred_language" text,
	"display_picture" jsonb,
	"display_icon" jsonb,
	CONSTRAINT "userProfile_pk" PRIMARY KEY("context_correlation_id","id")
);
--> statement-breakpoint
ALTER TABLE "UserProfile" ADD CONSTRAINT "userProfile_fk_context" FOREIGN KEY ("context_correlation_id") REFERENCES "public"."Context"("context_correlation_id") ON DELETE cascade ON UPDATE no action;