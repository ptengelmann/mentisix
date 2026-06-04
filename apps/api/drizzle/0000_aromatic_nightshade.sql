CREATE TABLE "runs" (
	"id" uuid PRIMARY KEY NOT NULL,
	"challenge" text NOT NULL,
	"seed" integer NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"status" text NOT NULL,
	"score" integer,
	"steps_used" integer NOT NULL,
	"tokens_used" integer NOT NULL,
	"ms_used" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"error" text
);
--> statement-breakpoint
CREATE INDEX "runs_challenge_status_score_idx" ON "runs" USING btree ("challenge","status","score");--> statement-breakpoint
CREATE INDEX "runs_provider_model_idx" ON "runs" USING btree ("provider","model");