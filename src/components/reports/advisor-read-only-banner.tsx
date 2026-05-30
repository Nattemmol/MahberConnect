import { Eye } from "lucide-react";

export function AdvisorReadOnlyBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-gold/30 bg-gold/5 px-4 py-3 text-sm text-text-secondary">
      <Eye className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <p>
        You have read-only <span className="font-medium text-text-primary">Advisor</span>{" "}
        access. You can view reports and the audit trail but cannot change mahber data.
      </p>
    </div>
  );
}
