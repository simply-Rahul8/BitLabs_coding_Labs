type BadgeStatus = "draft" | "active" | "completed" | "failed";

type BadgeProps = {
  status: BadgeStatus;
  children?: string;
};

const statusClasses: Record<BadgeStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  active: "bg-emerald-100 text-emerald-700",
  completed: "bg-blue-100 text-blue-700",
  failed: "bg-red-100 text-red-700"
};

export default function Badge({ status, children }: BadgeProps) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[status]}`}>
      {children ?? status}
    </span>
  );
}
