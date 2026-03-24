-- New submissions after this migration use is_viewed_in_crm correctly via the app.
-- Existing rows that already have answers: treat as already seen in CRM.
ALTER TABLE "TaxRefundQuestionnaire" ADD COLUMN "is_viewed_in_crm" BOOLEAN NOT NULL DEFAULT false;

UPDATE "TaxRefundQuestionnaire" SET "is_viewed_in_crm" = true WHERE "date_received" IS NOT NULL;
