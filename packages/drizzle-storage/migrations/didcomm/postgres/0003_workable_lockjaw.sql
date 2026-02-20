ALTER TABLE "DidcommCredentialExchange" ALTER COLUMN "credential_attributes" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "DidcommMessage" ALTER COLUMN "message" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "DidcommOutOfBand" ALTER COLUMN "out_of_band_invitation" SET DATA TYPE text;