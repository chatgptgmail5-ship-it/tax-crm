/**
 * Tax refund questionnaire scoring (שאלון החזר מס).
 * Q1–Q2 = תנאי סף. Q3–Q16 = percentage weights.
 */

export const QUESTION_WEIGHTS: Record<number, number> = {
  3: 4,
  4: 9,
  5: 7,
  6: 3,
  7: 7,
  8: 12,
  9: 7,
  10: 3,
  11: 3,
  12: 9,
  13: 5,
  14: 8,
  15: 9,
  16: 0,
};

const FAIL_ANSWERS = ["המבקש/ת", "בן/בת הזוג"] as const;
const ADD_PERCENT_ANSWERS = ["המבקש/ת", "בן/בת הזוג"] as const;

export type QuestionnaireAnswers = Record<string, string>;

/** Returns "לא מגיע" or percentage string like "52%" */
export function calculateResult(answers: QuestionnaireAnswers): string {
  const q1 = String(answers.q1 ?? "").trim();
  const q2 = String(answers.q2 ?? "").trim();

  // תנאי סף
  if (FAIL_ANSWERS.some((a) => q1 === a)) return "לא מגיע";
  if (q2 === "לא") return "לא מגיע";

  let total = 0;
  for (let i = 3; i <= 16; i++) {
    const ans = String(answers[`q${i}`] ?? "").trim();
    if (ADD_PERCENT_ANSWERS.some((a) => ans === a)) {
      total += QUESTION_WEIGHTS[i] ?? 0;
    }
  }
  return `${total}%`;
}
