import { InlineSpinner } from "@/components/InlineSpinner";

export default function RootLoading() {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-500" dir="rtl">
      <InlineSpinner className="size-8 text-primary-600" />
      <p className="text-sm">טוען...</p>
    </div>
  );
}
