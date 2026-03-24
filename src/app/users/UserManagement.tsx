"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Shield, UserPlus, Trash2 } from "lucide-react";
import { formatDateTime } from "@/lib/utils";

type User = {
  id: number;
  email: string | null;
  name: string | null;
  isAdmin: boolean;
  role: string;
  createdAt: Date;
};

export function UserManagement({ users }: { users: User[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [adding, setAdding] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "clerk" | "viewer">("clerk");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAddUser(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("הסיסמה חייבת להכיל לפחות 6 תווים.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, name, password, role }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "הוספת משתמש נכשלה.");
      return;
    }
    setAdding(false);
    setEmail("");
    setName("");
    setPassword("");
    setRole("clerk");
    router.refresh();
  }

  async function handleDelete(id: number) {
    if (!confirm("להסיר משתמש זה? הוא לא יוכל יותר להתחבר.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="card overflow-hidden">
        <div className="border-b border-ink-200 bg-primary-50/40 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-ink-900">כל המשתמשים</h2>
            {session?.user?.role === "admin" && (
              <button
                type="button"
                onClick={() => setAdding(!adding)}
                className="btn btn-primary"
              >
                <UserPlus className="h-4 w-4" />
                הוסף משתמש
              </button>
            )}
          </div>
        </div>

        {adding && (
          <form onSubmit={handleAddUser} className="border-b border-ink-200 p-6">
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="new-email" className="label block mb-1">אימייל</label>
                <input
                  id="new-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label htmlFor="new-name" className="label block mb-1">שם</label>
                <input
                  id="new-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                />
              </div>
              <div>
                <label htmlFor="new-password" className="label block mb-1">סיסמה</label>
                <input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label htmlFor="new-role" className="label block mb-1">תפקיד</label>
                <select
                  id="new-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as "admin" | "clerk" | "viewer")}
                  className="input"
                >
                  <option value="admin">אדמין</option>
                  <option value="clerk">פקיד/ה</option>
                  <option value="viewer">צופה</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "מוסיף…" : "הוסף"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdding(false);
                    setError("");
                  }}
                  className="btn btn-secondary"
                >
                  ביטול
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead>
              <tr className="border-b border-ink-200 bg-primary-50/40">
                <th className="px-6 py-4 font-medium text-ink-700 text-center">שם</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">אימייל</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">תפקיד</th>
                <th className="px-6 py-4 font-medium text-ink-700 text-center">נוסף</th>
                <th className="px-6 py-4 text-center" />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-100 transition-colors hover:bg-primary-50/50">
                  <td className="px-6 py-4 font-medium text-ink-900 text-center">{u.name ?? "—"}</td>
                  <td className="px-6 py-4 text-ink-600 text-center">{u.email ?? "—"}</td>
                  <td className="px-6 py-4 text-center">
                    {u.role === "admin" ? (
                      <span className="inline-flex items-center gap-1 rounded bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                        <Shield className="h-3 w-3" /> אדמין
                      </span>
                    ) : u.role === "clerk" ? (
                      <span className="text-ink-600">פקיד/ה</span>
                    ) : (
                      <span className="text-ink-500">צופה</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-ink-500 text-center">
                    <span className="tabular-nums">{formatDateTime(u.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {session?.user?.role === "admin" && u.id !== Number(session?.user?.id) && (
                      <button
                        type="button"
                        onClick={() => handleDelete(u.id)}
                        className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600"
                        title="הסר משתמש"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
