CREATE TABLE "aum_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"action" varchar(40) NOT NULL,
	"transfer_id" varchar(100),
	"status_code" integer,
	"meta" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aum_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"transfer_id" varchar(100) NOT NULL,
	"message_type_code" integer NOT NULL,
	"message_type" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"removed_at" timestamp,
	"removed_by" varchar(20),
	CONSTRAINT "aum_messages_transfer_id_unique" UNIQUE("transfer_id")
);
