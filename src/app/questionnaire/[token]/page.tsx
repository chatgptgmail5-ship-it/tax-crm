"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { ID_FIELDS, OPTIONS, GENDER_OPTIONS, MARITAL_OPTIONS, QUESTION_FIELDS } from "@/lib/questionnaire-fields";

export default function QuestionnairePage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  function setAnswer(key: string, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function setQuestionAnswer(q: number, value: string) {
    setAnswers((prev) => ({ ...prev, [`q${q}`]: value }));
  }

  async function handleSubmit() {
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/questionnaire/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "שגיאה");
        return;
      }
      setDone(true);
    } catch {
      setError("שגיאה בשליחה");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-slate-50" dir="rtl">
        <p className="text-slate-600 text-lg">קישור לא תקין</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 bg-slate-50" dir="rtl">
        <div className="bg-white rounded-xl shadow-md p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">תודה!</h1>
          <p className="text-slate-600 text-lg">השאלון נשלח בהצלחה.</p>
        </div>
      </div>
    );
  }

  const inputCls = "w-full min-h-[48px] px-4 py-3 text-base border border-slate-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-white";
  const labelCls = "block font-medium text-slate-800 text-base mb-2";
  const radioCls = "min-w-[24px] min-h-[24px] accent-sky-600";
  const radioLabelCls = "flex items-center gap-3 py-2 px-4 min-h-[48px] rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 active:bg-slate-100";

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:py-8" dir="rtl">
      <div className="mx-auto max-w-xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 text-center">שאלון החזר מס</h1>
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-6">
          {/* Identification — not numbered */}
          <div className="space-y-6 pb-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 text-lg">פרטי זיהוי</h2>
            {ID_FIELDS.map((f) => (
              <div key={f.key} className="space-y-2">
                <label className={labelCls}>{f.label}</label>
                {f.sublabel && <p className="text-sm text-slate-500 -mt-1">{f.sublabel}</p>}
                {f.type === "text" && (
                  <input
                    type="text"
                    inputMode="text"
                    value={answers[f.key] ?? ""}
                    onChange={(e) => setAnswer(f.key, e.target.value)}
                    className={inputCls}
                    dir="rtl"
                  />
                )}
                {f.type === "date" && (
                  <input
                    type="date"
                    value={answers[f.key] ?? ""}
                    onChange={(e) => setAnswer(f.key, e.target.value)}
                    className={inputCls}
                  />
                )}
                {f.type === "gender" && (
                  <div className="grid grid-cols-2 gap-3">
                    {GENDER_OPTIONS.map((opt) => (
                      <label key={opt} className={radioLabelCls}>
                        <input
                          type="radio"
                          name={f.key}
                          value={opt}
                          checked={answers[f.key] === opt}
                          onChange={() => setAnswer(f.key, opt)}
                          className={radioCls}
                        />
                        <span className="text-base">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
                {f.type === "marital" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {MARITAL_OPTIONS.map((opt) => (
                      <label key={opt} className={radioLabelCls}>
                        <input
                          type="radio"
                          name={f.key}
                          value={opt}
                          checked={answers[f.key] === opt}
                          onChange={() => setAnswer(f.key, opt)}
                          className={radioCls}
                        />
                        <span className="text-base">{opt}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Questions 1–16 — numbered */}
          {QUESTION_FIELDS.map((q, idx) => (
            <div key={q.key} className="space-y-3 py-4 border-b border-slate-100 last:border-0">
              <label className={`${labelCls} mt-2`}>{idx + 1}. {q.question}</label>
              <p className="text-sm text-slate-600 whitespace-pre-line">* {q.note}</p>
              <div className="flex flex-col gap-2">
                {OPTIONS.map((opt) => (
                  <label key={opt} className={radioLabelCls}>
                    <input
                      type="radio"
                      name={q.key}
                      value={opt}
                      checked={answers[q.key] === opt}
                      onChange={() => setAnswer(q.key, opt)}
                      className={radioCls}
                      style={answers[q.key] === opt ? { accentColor: "#166534" } : undefined}
                    />
                    <span className="text-base">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}

          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full min-h-[52px] px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-lg rounded-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {submitting ? "שולח…" : "סיים"}
          </button>
        </div>
      </div>
    </div>
  );
}
