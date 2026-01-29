CREATE TYPE "public"."DidcommMediaSharingRole" AS ENUM('sender', 'receiver');--> statement-breakpoint
CREATE TYPE "public"."DidcommMediaSharingState" AS ENUM('init', 'media-requested', 'media-shared', 'done');--> statement-breakpoint
CREATE TABLE "DidcommMediaSharing" (
	"context_correlation_id" text NOT NULL,
	"id" text NOT NULL,
	"created_at" timestamp (3) with time zone NOT NULL,
	"updated_at" timestamp (3) with time zone NOT NULL,
	"metadata" jsonb,
	"custom_tags" jsonb,
	"sent_time" timestamp (3) with time zone,
	"state" "DidcommMediaSharingState" NOT NULL,
	"role" "DidcommMediaSharingRole" NOT NULL,
	"connection_id" text NOT NULL,
	"thread_id" text NOT NULL,
	"parent_thread_id" text NOT NULL,
	"description" text NOT NULL,
	"items" jsonb,
	CONSTRAINT "didcommMediaSharing_pk" PRIMARY KEY("context_correlation_id","id"),
	CONSTRAINT "DidcommMediaSharing_context_correlation_id_thread_id_unique" UNIQUE("context_correlation_id","thread_id")
);
--> statement-breakpoint
ALTER TABLE "DidcommMediaSharing" ADD CONSTRAINT "didcommMediaSharing_fk_context" FOREIGN KEY ("context_correlation_id") REFERENCES "public"."Context"("context_correlation_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DidcommMediaSharing" ADD CONSTRAINT "DidcommMediaSharing_connection_id_context_correlation_id_DidcommConnection_id_context_correlation_id_fk" FOREIGN KEY ("connection_id","context_correlation_id") REFERENCES "public"."DidcommConnection"("id","context_correlation_id") ON DELETE cascade ON UPDATE no action;