/** True when the client submitted answers and CRM has not marked this row viewed since submission. */
export function isQuestionnaireUnread(dateReceived: Date | null, crmViewedAt: Date | null): boolean {
  if (!dateReceived) return false;
  if (!crmViewedAt) return true;
  return crmViewedAt.getTime() < dateReceived.getTime();
}
