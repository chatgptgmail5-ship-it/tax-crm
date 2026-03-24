-- AlterTable
ALTER TABLE "TaxRefundQuestionnaire" ADD COLUMN "is_viewed_in_crm" BOOLEAN NOT NULL DEFAULT false;

-- Existing received questionnaires: already handled in CRM before this feature
UPDATE "TaxRefundQuestionnaire"
SET "is_viewed_in_crm" = true
WHERE "date_received" IS NOT NULL;
