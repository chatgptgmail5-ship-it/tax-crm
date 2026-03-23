"use client";

import { Suspense, useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";

const LOCK_STORAGE_KEYS = { attempts: "loginFailedAttempts", locked: "loginLocked" } as const;
const LOCK_ADMIN_PASSWORD = "open1";
const MAX_ATTEMPTS = 3;

function LoginPageContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/";
  const errorParam = searchParams.get("error");
  const urlError = errorParam === "CredentialsSignin" ? "האימייל או הסיסמה שגויים" : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [showReset, setShowReset] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [adminPassword, setAdminPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockUnlockPassword, setLockUnlockPassword] = useState("");
  const [lockUnlockError, setLockUnlockError] = useState("");
  const [mounted, setMounted] = useState(false);
  const errorMessage = submitError || urlError;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const locked = localStorage.getItem(LOCK_STORAGE_KEYS.locked) === "1";
    setIsLocked(locked);
    setMounted(true);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isLocked) return;
    setSubmitError("");

    const res = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });

    if (res?.error) {
      setSubmitError("האימייל או הסיסמה שגויים");
      const raw = localStorage.getItem(LOCK_STORAGE_KEYS.attempts);
      const attempts = Math.min(MAX_ATTEMPTS, (raw ? parseInt(raw, 10) : 0) + 1);
      localStorage.setItem(LOCK_STORAGE_KEYS.attempts, String(attempts));
      if (attempts >= MAX_ATTEMPTS) {
        localStorage.setItem(LOCK_STORAGE_KEYS.locked, "1");
        setIsLocked(true);
      }
    } else if (res?.url) {
      localStorage.removeItem(LOCK_STORAGE_KEYS.attempts);
      localStorage.removeItem(LOCK_STORAGE_KEYS.locked);
      window.location.href = res.url;
    }
  }

  function handleLockUnlockSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLockUnlockError("");
    if (lockUnlockPassword !== LOCK_ADMIN_PASSWORD) {
      setLockUnlockError("סיסמת מנהל שגויה");
      return;
    }
    localStorage.removeItem(LOCK_STORAGE_KEYS.attempts);
    localStorage.removeItem(LOCK_STORAGE_KEYS.locked);
    setIsLocked(false);
    setLockUnlockPassword("");
  }

  function openResetModal() {
    if (!email.trim()) {
      setSubmitError("קודם צריך להזין אימייל");
      return;
    }
    setSubmitError("");
    setResetStep(1);
    setAdminPassword("");
    setNewPassword("");
    setResetError("");
    setShowReset(true);
  }

  function closeResetModal() {
    setShowReset(false);
    setResetStep(1);
    setAdminPassword("");
    setNewPassword("");
    setResetError("");
    setResetLoading(false);
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetError("");

    if (!email.trim()) {
      setResetError("קודם צריך להזין אימייל");
      return;
    }

    if (adminPassword !== "password2010") {
      setResetError("סיסמת מנהל שגויה");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setResetError("הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }

    try {
      setResetLoading(true);

      const res = await fetch("/api/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          adminPassword,
          email,
          newPassword,
        }),
      });

      const data = await res.json();
      setResetLoading(false);

      if (!res.ok) {
        setResetError(data.error ?? "איפוס הסיסמה נכשל");
        return;
      }

      alert("הסיסמה עודכנה בהצלחה");
      closeResetModal();
    } catch {
      setResetLoading(false);
      setResetError("איפוס הסיסמה נכשל");
    }
  }

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink-50">
        <div className="text-ink-500">טוען...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            <span className="relative h-14 w-14 shrink-0">
              <Image
                src="/logo.png"
                alt=""
                width={56}
                height={56}
                className="object-contain"
                unoptimized
              />
            </span>
            <h1 className="text-center text-xl font-bold text-ink-900">ניהול לקוחות מס</h1>
            <p className="text-center text-sm text-ink-600">התחבר כדי להמשיך</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label block mb-1">אימייל</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setSubmitError("");
                }}
                className="input"
                required
                autoComplete="email"
                disabled={isLocked}
              />
            </div>

            <div>
              <label htmlFor="password" className="label block mb-1">סיסמה</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setSubmitError("");
                }}
                className="input"
                required
                autoComplete="current-password"
                disabled={isLocked}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={isLocked}>
              התחבר
            </button>

            {errorMessage && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">
                {errorMessage}
              </div>
            )}
          </form>

          <button
            type="button"
            onClick={openResetModal}
            className="mt-3 w-full text-center text-sm text-primary-600 hover:underline"
            disabled={isLocked}
          >
            שכחתי סיסמה
          </button>
        </div>
      </div>

      {isLocked && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="lock-title"
        >
          <div className="card w-full max-w-sm p-6 shadow-xl">
            <h2 id="lock-title" className="mb-4 text-center text-lg font-semibold text-ink-900">
              עקב ריבוי ניסיונות כושלים נחסמת!
              <br />
              הזן סיסמת מנהל
            </h2>
            {lockUnlockError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{lockUnlockError}</div>
            )}
            <form onSubmit={handleLockUnlockSubmit} className="space-y-4">
              <div>
                <label htmlFor="lock-admin-password" className="label block mb-1">סיסמת מנהל</label>
                <input
                  id="lock-admin-password"
                  type="password"
                  value={lockUnlockPassword}
                  onChange={(e) => {
                    setLockUnlockPassword(e.target.value);
                    setLockUnlockError("");
                  }}
                  className="input"
                  autoComplete="off"
                />
              </div>
              <button type="submit" className="btn btn-primary w-full">
                פתח חסימה
              </button>
            </form>
          </div>
        </div>
      )}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="card w-full max-w-sm p-6">
            <h2 className="mb-4 text-lg font-semibold text-ink-900">איפוס סיסמה</h2>

            {resetError && (
              <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {resetError}
              </div>
            )}

            {resetStep === 1 && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();

                  if (adminPassword !== "password2010") {
                    setResetError("סיסמת מנהל שגויה");
                    return;
                  }

                  setResetError("");
                  setResetStep(2);
                }}
                className="space-y-4"
              >
                <p className="text-sm text-ink-700">
                  בשביל לשנות סיסמה הזן סיסמת מנהל
                </p>

                <div>
                  <label className="label block mb-1">סיסמת מנהל</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => {
                      setAdminPassword(e.target.value);
                      setResetError("");
                    }}
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="btn btn-secondary"
                  >
                    ביטול
                  </button>

                  <button type="submit" className="btn btn-primary">
                    אישור
                  </button>
                </div>
              </form>
            )}

            {resetStep === 2 && (
              <form onSubmit={handleResetSubmit} className="space-y-4">
                <p className="text-sm text-ink-700">מהי הסיסמה החדשה?</p>

                <div>
                  <label className="label block mb-1">סיסמה חדשה</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setResetError("");
                    }}
                    className="input"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeResetModal}
                    className="btn btn-secondary"
                    disabled={resetLoading}
                  >
                    ביטול
                  </button>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={resetLoading}
                  >
                    {resetLoading ? "מעדכן…" : "עדכון"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-ink-50"><div className="text-ink-500">טוען...</div></div>}>
      <LoginPageContent />
    </Suspense>
  );
}