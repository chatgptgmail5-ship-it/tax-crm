export const dynamic = "force-dynamic";

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink-900">הערות</h1>
      </div>
      <div className="card p-6">
        <p className="text-center text-ink-500">אין הערות עדיין</p>
      </div>
    </div>
  );
}
